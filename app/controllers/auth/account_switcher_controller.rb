# frozen_string_literal: true

class Auth::AccountSwitcherController < ApplicationController
  include AccountSwitcherConcern

  before_action :authenticate_user!
  skip_before_action :authenticate_user!, only: :cancel

  def show
    remember_switchable_account(current_user)
    render_accounts
  end

  def add
    start_switchable_account_add(current_user)

    respond_with_redirect(new_user_session_path(account_switcher: 'add'))
  end

  def cancel
    return_user = switchable_account_return_user
    stop_switchable_account_add

    if return_user&.functional?
      sign_in(:user, return_user)
      remember_switchable_account(return_user)

      respond_with_redirect('/web/home')
    else
      respond_with_redirect(new_user_session_path)
    end
  end

  def switch
    remember_switchable_account(current_user)
    stop_switchable_account_add

    target_user = switchable_account_users.find { |user| user.account_id.to_s == account_id_param }

    return render json: { error: 'Account is not available for switching' }, status: 404 unless target_user
    return render json: { error: 'Your login is currently disabled' }, status: 403 unless target_user.functional?

    sign_in(:user, target_user)
    remember_switchable_account(target_user)

    respond_with_redirect('/web/home')
  end

  def remove
    target_user = switchable_account_users.find { |user| user.account_id.to_s == account_id_param }

    forget_switchable_account(target_user) if target_user && target_user != current_user
    remember_switchable_account(current_user)

    render_accounts
  end

  def logout
    forget_switchable_account(current_user)

    next_user = switchable_account_users.find(&:functional?)

    if next_user
      SessionActivation.deactivate(cookies.signed['_session_id'])
      cookies.delete('_session_id')
      sign_in(:user, next_user)
      remember_switchable_account(next_user)

      respond_with_redirect('/web/home')
    else
      sign_out(:user)

      respond_with_redirect(new_user_session_path)
    end
  end

  private

  def account_id_param
    params.require(:account_id).to_s
  end

  def render_accounts
    users = switchable_account_users.select(&:functional?)
    accounts = users.map(&:account)

    render json: {
      current_account_id: current_user.account_id.to_s,
      accounts: accounts.map { |account| serialized_account(account) },
    }
  end

  def serialized_account(account)
    ActiveModelSerializers::SerializableResource.new(
      account,
      serializer: REST::AccountSerializer,
      scope: current_user,
      scope_name: :current_user
    ).as_json
  end

  def respond_with_redirect(path)
    respond_to do |format|
      format.json { render json: { redirect_to: path } }
      format.any  { redirect_to path }
    end
  end
end
