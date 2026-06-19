# frozen_string_literal: true

class CreateAdminDirectMessageReads < ActiveRecord::Migration[8.0]
  def up
    create_table :admin_direct_message_reads do |t|
      t.references :account, null: false, foreign_key: { on_delete: :cascade }, index: false
      t.references :conversation, null: false, foreign_key: { on_delete: :cascade }, index: false
      t.references :last_status, null: false, foreign_key: { to_table: :statuses, on_delete: :cascade }, index: false

      t.timestamps
    end

    add_index :admin_direct_message_reads, [:account_id, :conversation_id], unique: true

    safety_assured do
      execute <<~SQL.squish
        INSERT INTO admin_direct_message_reads (account_id, conversation_id, last_status_id, created_at, updated_at)
        SELECT users.account_id, latest_statuses.conversation_id, latest_statuses.last_status_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM users
        INNER JOIN user_roles ON user_roles.id = users.role_id
        CROSS JOIN (
          SELECT statuses.conversation_id, MAX(statuses.id) AS last_status_id
          FROM statuses
          WHERE statuses.deleted_at IS NULL AND statuses.visibility = 3 AND statuses.conversation_id IS NOT NULL
          GROUP BY statuses.conversation_id
        ) latest_statuses
        WHERE users.account_id IS NOT NULL AND (user_roles.permissions & 17) <> 0
        ON CONFLICT (account_id, conversation_id) DO NOTHING
      SQL
    end
  end

  def down
    drop_table :admin_direct_message_reads
  end
end
