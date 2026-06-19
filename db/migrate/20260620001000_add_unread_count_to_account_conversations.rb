# frozen_string_literal: true

class AddUnreadCountToAccountConversations < ActiveRecord::Migration[8.0]
  def up
    add_column :account_conversations, :unread_count, :integer, null: false, default: 0

    AccountConversation.where(unread: true, unread_count: 0).update_all(unread_count: 1)
  end

  def down
    remove_column :account_conversations, :unread_count
  end
end
