# frozen_string_literal: true

# == Schema Information
#
# Table name: admin_direct_message_reads
#
#  id              :bigint(8)        not null, primary key
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  account_id      :bigint(8)        not null
#  conversation_id :bigint(8)        not null
#  last_status_id  :bigint(8)        not null
#
class Admin::DirectMessageRead < ApplicationRecord
  belongs_to :account
  belongs_to :conversation
  belongs_to :last_status, class_name: 'Status'

  validates :account_id, uniqueness: { scope: :conversation_id }
end
