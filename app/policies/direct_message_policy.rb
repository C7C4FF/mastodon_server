# frozen_string_literal: true

class DirectMessagePolicy < ApplicationPolicy
  def index?
    role.can?(:manage_reports)
  end

  def show?
    index?
  end
end
