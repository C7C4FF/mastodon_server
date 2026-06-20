# frozen_string_literal: true

class RemoveInviteUsersFromEveryoneRole < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  EVERYONE_ROLE_ID = -99
  INVITE_USERS_PERMISSION = 1 << 16

  def up
    safety_assured do
      execute <<~SQL.squish
        UPDATE user_roles
        SET permissions = permissions & ~#{INVITE_USERS_PERMISSION}
        WHERE id = #{EVERYONE_ROLE_ID}
      SQL
    end
  end

  def down
    safety_assured do
      execute <<~SQL.squish
        UPDATE user_roles
        SET permissions = permissions | #{INVITE_USERS_PERMISSION}
        WHERE id = #{EVERYONE_ROLE_ID}
      SQL
    end
  end
end
