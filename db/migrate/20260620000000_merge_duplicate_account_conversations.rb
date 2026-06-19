# frozen_string_literal: true

class MergeDuplicateAccountConversations < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def up
    remove_legacy_unique_index!
    merge_duplicate_account_conversations!

    return if index_exists?(:account_conversations, [:account_id, :conversation_id], name: 'index_account_conversations_on_account_id_and_conversation_id')

    add_index :account_conversations,
              [:account_id, :conversation_id],
              unique: true,
              algorithm: :concurrently,
              name: 'index_account_conversations_on_account_id_and_conversation_id'
  end

  def down
    remove_index :account_conversations,
                 name: 'index_account_conversations_on_account_id_and_conversation_id',
                 algorithm: :concurrently if index_exists?(:account_conversations, [:account_id, :conversation_id], name: 'index_account_conversations_on_account_id_and_conversation_id')

    return if index_exists?(:account_conversations, [:account_id, :conversation_id, :participant_account_ids], name: 'index_unique_conversations')

    add_index :account_conversations,
              [:account_id, :conversation_id, :participant_account_ids],
              unique: true,
              algorithm: :concurrently,
              name: 'index_unique_conversations'
  end

  private

  def remove_legacy_unique_index!
    return unless index_exists?(:account_conversations, [:account_id, :conversation_id, :participant_account_ids], name: 'index_unique_conversations')

    remove_index :account_conversations,
                 name: 'index_unique_conversations',
                 algorithm: :concurrently
  end

  def merge_duplicate_account_conversations!
    duplicate_groups.pluck(:account_id, :conversation_id).each do |account_id, conversation_id|
      conversations = AccountConversation
        .where(account_id: account_id, conversation_id: conversation_id)
        .order(:id)
        .to_a

      keeper = conversations.shift
      next if keeper.nil? || conversations.empty?

      merged_status_ids = (keeper.status_ids + conversations.flat_map(&:status_ids)).uniq.sort
      keeper.update_columns(
        status_ids: merged_status_ids,
        participant_account_ids: participant_account_ids_for(keeper.account_id, merged_status_ids),
        last_status_id: merged_status_ids.last
      )

      AccountConversation.where(id: conversations.map(&:id)).delete_all
    end
  end

  def duplicate_groups
    AccountConversation
      .select(:account_id, :conversation_id)
      .group(:account_id, :conversation_id)
      .having('COUNT(*) > 1')
  end

  def participant_account_ids_for(account_id, status_ids)
    Status
      .where(id: status_ids)
      .preload(:active_mentions)
      .flat_map { |status| status.active_mentions.map(&:account_id) + [status.account_id] }
      .uniq
      .then { |account_ids| account_ids - [account_id] }
      .sort
  end
end
