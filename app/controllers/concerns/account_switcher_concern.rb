# frozen_string_literal: true

module AccountSwitcherConcern
  extend ActiveSupport::Concern

  SWITCHABLE_ACCOUNT_IDS_SESSION_KEY = :switchable_account_user_ids

  private

  def remember_switchable_account(user)
    return unless user&.account_id

    session[SWITCHABLE_ACCOUNT_IDS_SESSION_KEY] = switchable_account_user_ids
      .push(user.id)
      .uniq
  end

  def forget_switchable_account(user)
    return unless user

    session[SWITCHABLE_ACCOUNT_IDS_SESSION_KEY] = switchable_account_user_ids - [user.id]
  end

  def switchable_account_user_ids
    Array(session[SWITCHABLE_ACCOUNT_IDS_SESSION_KEY]).filter_map { |id| id.to_i.presence }
  end

  def switchable_account_users
    ids = switchable_account_user_ids
    return User.none if ids.empty?

    User.includes(:account).where(id: ids).index_by(&:id).values_at(*ids).compact
  end
end
