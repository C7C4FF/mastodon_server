# frozen_string_literal: true

module BrandingHelper
  def logo_as_symbol(version = :icon)
    case version
    when :icon
      _logo_as_symbol_icon
    when :wordmark
      _logo_as_symbol_wordmark
    end
  end

  def _logo_as_symbol_wordmark
    image_tag(
      frontend_asset_path('images/c7c4ff_logo_icon.png'),
      alt: 'C7C4FF',
      class: 'logo logo--wordmark logo--c7c4ff'
    )
  end

  def _logo_as_symbol_icon
    image_tag(
      frontend_asset_path('images/c7c4ff_logo_icon.png'),
      alt: 'C7C4FF',
      class: 'logo logo--icon logo--c7c4ff'
    )
  end

  def render_logo
    image_tag(
      frontend_asset_path('images/c7c4ff_logo_icon.png'),
      alt: 'C7C4FF',
      class: 'logo logo--icon logo--c7c4ff'
    )
  end
end
