# frozen_string_literal: true

class Api::V1::Admin::DirectMessagesController < Api::BaseController
  include Authorization

  LIMIT = 20

  DirectMessageConversation = Struct.new(:id, :participant_accounts, :last_status, :unread, :unread_count, keyword_init: true) do
    def self.model_name
      ActiveModel::Name.new(self, nil, 'AccountConversation')
    end

    def read_attribute_for_serialization(attribute)
      public_send(attribute)
    end
  end

  before_action -> { doorkeeper_authorize! :read, :'read:statuses' }, only: :index
  before_action -> { doorkeeper_authorize! :write, :'write:conversations' }, only: :read
  before_action :require_user!
  after_action :verify_authorized
  after_action :insert_pagination_headers, only: :index

  def index
    authorize :direct_message, :index?

    @last_statuses = paginated_last_statuses
    @conversations = build_conversations

    render json: @conversations, each_serializer: REST::ConversationSerializer, relationships: StatusRelationshipsPresenter.new(@last_statuses, current_account.id)
  end

  def read
    authorize :direct_message, :index?

    status = latest_status_for_conversation(params[:id])
    mark_conversation_read!(status) if status

    render_empty
  end

  private

  def paginated_last_statuses
    Status
      .where(id: latest_direct_status_ids)
      .includes(:media_attachments, :status_stat, :tags, preview_cards_status: { preview_card: { author_account: [:account_stat, user: :role] } }, active_mentions: :account, account: [:account_stat, user: :role])
      .to_a_paginated_by_id(limit_param(LIMIT), params_slice(:max_id, :since_id, :min_id))
  end

  def latest_direct_status_ids
    Status.direct_visibility.where.not(conversation_id: nil).unscope(:order).select('MAX(statuses.id)').group(:conversation_id)
  end

  def build_conversations
    participant_accounts_by_conversation_id = participants_by_conversation_id
    read_status_ids_by_conversation_id = read_status_ids_by_conversation_id(@last_statuses.map(&:conversation_id))

    @last_statuses.map do |status|
      unread = unread_status?(status, read_status_ids_by_conversation_id[status.conversation_id])

      DirectMessageConversation.new(
        id: status.conversation_id.to_s,
        participant_accounts: participant_accounts_by_conversation_id[status.conversation_id] || [status.account],
        last_status: status,
        unread: unread,
        unread_count: unread ? 1 : 0
      )
    end
  end

  def read_status_ids_by_conversation_id(conversation_ids)
    Admin::DirectMessageRead
      .where(account: current_account, conversation_id: conversation_ids)
      .pluck(:conversation_id, :last_status_id)
      .to_h
  end

  def unread_status?(status, read_status_id)
    return false if status.account_id == current_account.id

    read_status_id.nil? || status.id > read_status_id
  end

  def latest_status_for_conversation(conversation_id)
    Status
      .direct_visibility
      .where(conversation_id: conversation_id)
      .order(id: :desc)
      .first
  end

  def mark_conversation_read!(status)
    Admin::DirectMessageRead.upsert(
      {
        account_id: current_account.id,
        conversation_id: status.conversation_id,
        last_status_id: status.id,
        created_at: Time.current,
        updated_at: Time.current,
      },
      unique_by: [:account_id, :conversation_id]
    )
  end

  def participants_by_conversation_id
    Status
      .direct_visibility
      .where(conversation_id: @last_statuses.map(&:conversation_id))
      .preload(:account, active_mentions: :account)
      .group_by(&:conversation_id)
      .transform_values { |statuses| participants_from(statuses) }
  end

  def participants_from(statuses)
    statuses.flat_map { |status| [status.account] + status.active_mentions.map(&:account) }.compact.uniq(&:id)
  end

  def next_path
    api_v1_admin_direct_messages_url pagination_params(max_id: pagination_max_id) if records_continue?
  end

  def prev_path
    api_v1_admin_direct_messages_url pagination_params(min_id: pagination_since_id) unless @last_statuses.empty?
  end

  def pagination_max_id
    @last_statuses.last.id
  end

  def pagination_since_id
    @last_statuses.first.id
  end

  def records_continue?
    @last_statuses.size == limit_param(LIMIT)
  end
end
