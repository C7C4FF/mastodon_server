# frozen_string_literal: true

class PushConversationWorker
  include Sidekiq::Worker
  include Redisable

  DirectMessageConversation = Struct.new(:id, :participant_accounts, :last_status, :unread, :unread_count, keyword_init: true) do
    def self.model_name
      ActiveModel::Name.new(self, nil, 'AccountConversation')
    end

    def read_attribute_for_serialization(attribute)
      public_send(attribute)
    end
  end

  def perform(conversation_account_id)
    conversation = AccountConversation.find(conversation_account_id)
    message      = InlineRenderer.render(conversation, conversation.account, :conversation)

    ["timeline:direct:#{conversation.account_id}", "timeline:#{conversation.account_id}"].each do |timeline_id|
      redis.publish(timeline_id, { event: :conversation, payload: message }.to_json)
    end

    push_to_staff_streams!(conversation)
  rescue ActiveRecord::RecordNotFound
    true
  end

  private

  def push_to_staff_streams!(conversation)
    return unless staff_subscribed?

    status = Status
      .includes(:media_attachments, :status_stat, :tags, preview_cards_status: { preview_card: { author_account: [:account_stat, user: :role] } }, active_mentions: :account, account: [:account_stat, user: :role])
      .find_by(id: conversation.last_status_id)

    return if status.nil?

    participant_accounts = participant_accounts_for(conversation.conversation_id)

    User.those_who_can(:manage_reports).includes(:account).find_each do |user|
      next if user.account.nil? || !redis.exists?("subscribed:timeline:#{user.account_id}")

      unread = unread_for_staff?(status, user.account)
      all_conversation = DirectMessageConversation.new(
        id: conversation.conversation_id.to_s,
        participant_accounts: participant_accounts,
        last_status: status,
        unread: unread,
        unread_count: unread ? 1 : 0
      )
      message = InlineRenderer.render(all_conversation, user.account, :conversation)
      redis.publish("timeline:#{user.account_id}", { event: :all_conversation, payload: message }.to_json)
    end
  end

  def participant_accounts_for(conversation_id)
    Status
      .direct_visibility
      .where(conversation_id: conversation_id)
      .preload(:account, active_mentions: :account)
      .flat_map { |status| [status.account] + status.active_mentions.map(&:account) }
      .compact
      .uniq(&:id)
  end

  def unread_for_staff?(status, account)
    return false if status.account_id == account.id

    read_status_id = Admin::DirectMessageRead.where(account: account, conversation_id: status.conversation_id).pick(:last_status_id)

    read_status_id.nil? || status.id > read_status_id
  end

  def staff_subscribed?
    User.those_who_can(:manage_reports).includes(:account).any? { |user| user.account_id && redis.exists?("subscribed:timeline:#{user.account_id}") }
  end
end
