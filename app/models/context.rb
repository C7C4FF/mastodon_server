# frozen_string_literal: true

class Context < ActiveModelSerializers::Model
  attributes :ancestors, :descendants, :direct_messages
end
