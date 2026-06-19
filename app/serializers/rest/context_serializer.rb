# frozen_string_literal: true

class REST::ContextSerializer < ActiveModel::Serializer
  has_many :ancestors,   serializer: REST::StatusSerializer
  has_many :descendants, serializer: REST::StatusSerializer
  has_many :direct_messages, serializer: REST::StatusSerializer
end
