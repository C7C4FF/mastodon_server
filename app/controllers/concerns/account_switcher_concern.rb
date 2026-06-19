# frozen_string_literal: true

module AccountSwitcherConcern
  extend ActiveSupport::Concern

  SWITCHABLE_ACCOUNT_IDS_SESSION_KEY = :switchable_account_user_ids
  ADDING_SWITCHABLE_ACCOUNT_SESSION_KEY = :adding_switchable_account
  SWITCHABLE_ACCOUNT_RETURN_USER_ID_SESSION_KEY = :switchable_account_return_user_id

  private

  def start_switchable_account_add(user)
    return unless user&.id

    remember_switchable_account(user)
    session[ADDING_SWITCHABLE_ACCOUNT_SESSION_KEY] = true
    session[SWITCHABLE_ACCOUNT_RETURN_USER_ID_SESSION_KEY] = user.id
  end

  def stop_switchable_account_add
    session.delete(ADDING_SWITCHABLE_ACCOUNT_SESSION_KEY)
    session.delete(SWITCHABLE_ACCOUNT_RETURN_USER_ID_SESSION_KEY)
  end

  def adding_switchable_account?
    ActiveModel::Type::Boolean.new.cast(session[ADDING_SWITCHABLE_ACCOUNT_SESSION_KEY])
  end

  def switchable_account_return_user
    User.find_by(id: session[SWITCHABLE_ACCOUNT_RETURN_USER_ID_SESSION_KEY])
  end

  def remember_switchable_account(user)
    return unless user&.account_id

    session[SWITCHABLE_ACCOUNT_IDS_SESSION_KEY] = [
      user.id,
      *(switchable_account_user_ids - [user.id]),
    ]
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
