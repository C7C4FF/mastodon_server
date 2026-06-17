# frozen_string_literal: true

class MarkdownStatusFormatter
  include ERB::Util
  include RoutingHelper

  HEX_COLOR_RE = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?/
  TOKEN_PREFIX = 'MASTODON_MARKDOWN_TOKEN_'

  CUSTOM_TAGS = [
    {
      pattern: /\[color=(#{HEX_COLOR_RE})\](.*?)\[\/color\]/im,
      open: ->(value) { %(<span class="md-color" style="color: #{value.downcase}">) },
      close: '</span>',
    },
    {
      pattern: /\[bg=(#{HEX_COLOR_RE})\](.*?)\[\/bg\]/im,
      open: ->(value) { %(<span class="md-bg" style="background-color: #{value.downcase}">) },
      close: '</span>',
    },
    {
      pattern: /\[(left|center|right)\](.*?)\[\/\1\]/im,
      open: ->(value) { %(<span class="md-align-#{value.downcase}">) },
      close: '</span>',
    },
    {
      pattern: /\[big\](.*?)\[\/big\]/im,
      open: ->(_value) { '<span class="md-size-big">' },
      close: '</span>',
    },
  ].freeze

  attr_reader :text, :options

  def initialize(text, options = {})
    @text = text
    @options = options
    @tokens = {}
  end

  def to_s
    return add_quote_fallback('').html_safe if text.blank? # rubocop:disable Rails/OutputSafety

    html = markdown.render(tokenize_custom_tags(text))
    html = restore_custom_tags(html)
    html = linkify_text_nodes(html)
    html = Sanitize.fragment(html, Sanitize::Config::MASTODON_STRICT)
    html = add_quote_fallback(html) if options[:quoted_status].present?

    html.html_safe # rubocop:disable Rails/OutputSafety
  rescue ArgumentError
    ''.html_safe
  end

  private

  def markdown
    @markdown ||= Redcarpet::Markdown.new(
      Redcarpet::Render::HTML.new(escape_html: true, no_images: true),
      autolink: false,
      fenced_code_blocks: true,
      no_intra_emphasis: true,
      strikethrough: true
    )
  end

  def tokenize_custom_tags(input)
    CUSTOM_TAGS.reduce(input.dup) do |result, tag|
      previous = nil

      until previous == result
        previous = result
        result = result.gsub(tag[:pattern]) do
          value = Regexp.last_match.length == 3 ? Regexp.last_match(1) : nil
          content = Regexp.last_match(Regexp.last_match.length - 1)
          open_token = store_token(tag[:open].call(value))
          close_token = store_token(tag[:close])

          "#{open_token}#{content}#{close_token}"
        end
      end

      result
    end
  end

  def store_token(html)
    token = "#{TOKEN_PREFIX}#{@tokens.size}_"
    @tokens[token] = html
    token
  end

  def restore_custom_tags(html)
    @tokens.reduce(html) { |result, (token, replacement)| result.gsub(token, replacement) }
  end

  def linkify_text_nodes(html)
    fragment = Nokogiri::HTML5.fragment(html)

    fragment.traverse do |node|
      next unless node.text?
      next if node.text.blank?
      next if node.ancestors.any? { |ancestor| %w(a code pre).include?(ancestor.name) }

      replacement = TextFormatter.new(node.text, linkify_options).to_s
      node.replace(Nokogiri::HTML5.fragment(replacement))
    end

    fragment.to_html
  end

  def linkify_options
    options.merge(multiline: false, quoted_status: nil)
  end

  def add_quote_fallback(html)
    return html if options[:quoted_status].nil?

    url = ActivityPub::TagManager.instance.url_for(options[:quoted_status]) || ActivityPub::TagManager.instance.uri_for(options[:quoted_status])
    return html if url.blank? || html.include?(url)

    %(<p class="quote-inline">RE: #{TextFormatter.shortened_link(url)}</p>#{html})
  end
end
