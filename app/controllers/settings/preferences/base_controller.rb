# frozen_string_literal: true

class Settings::Preferences::BaseController < Settings::BaseController
  def show; end

  def update
    if current_user.update(user_params)
      I18n.locale = current_user.locale
      redirect_to after_update_redirect_path, notice: I18n.t('generic.changes_saved_msg')
    else
      render :show
    end
  end

  private

  def after_update_redirect_path
    raise 'Override in controller'
  end

  def user_params
    params.expect(user: [:time_zone, settings_attributes: UserSettings.keys]).tap do |permitted_params|
      permitted_params[:settings_attributes]&.delete(:default_language)
      permitted_params[:settings_attributes]&.delete('default_language')
    end
  end
end
