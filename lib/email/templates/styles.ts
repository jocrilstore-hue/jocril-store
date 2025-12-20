/**
 * Jocril Email Styles
 * Brand-consistent inline styles for email templates
 */

export const colors = {
  // Primary accent (Teal)
  primary: "#2DD4CD",
  primaryHover: "#16B7B2",
  primaryLight: "#00DED7",

  // Backgrounds
  bgDark: "#0A0A0A",
  bgLight: "#FFFFFF",
  bgMuted: "#FAFAFA",

  // Text
  textDark: "#1A1A1A",
  textMuted: "#6B7280",
  textLight: "#FFFFFF",

  // Borders
  borderLight: "#E5E5E5",
  borderDark: "#333333",
}

export const fonts = {
  sans: "'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'Geist Mono', 'SF Mono', 'Consolas', 'Liberation Mono', monospace",
}

// Base container style
export const containerStyle = `
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: ${fonts.sans};
  background-color: ${colors.bgLight};
  color: ${colors.textDark};
  line-height: 1.6;
`

// Header with logo area
export const headerStyle = `
  text-align: center;
  padding-bottom: 32px;
  border-bottom: 1px dashed ${colors.borderLight};
  margin-bottom: 32px;
`

// Logo text (since we may not have image)
export const logoStyle = `
  font-size: 28px;
  font-weight: 700;
  color: ${colors.textDark};
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
`

// Main heading
export const h1Style = `
  font-size: 24px;
  font-weight: 600;
  color: ${colors.textDark};
  margin: 0 0 16px 0;
  text-align: center;
`

// Section heading
export const h2Style = `
  font-size: 14px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 24px 0 12px 0;
  font-family: ${fonts.mono};
`

// Card/box with dashed border
export const cardStyle = `
  border: 1px dashed ${colors.borderLight};
  padding: 24px;
  margin: 16px 0;
  background-color: ${colors.bgMuted};
`

// Highlight box (for payment info)
export const highlightBoxStyle = `
  border: 2px solid ${colors.primary};
  padding: 24px;
  margin: 24px 0;
  background-color: ${colors.bgLight};
  text-align: center;
`

// Table row
export const tableRowStyle = `
  border-bottom: 1px solid ${colors.borderLight};
`

// Muted text
export const mutedTextStyle = `
  color: ${colors.textMuted};
  font-size: 14px;
`

// Primary button
export const buttonStyle = `
  display: inline-block;
  background-color: ${colors.primary};
  color: ${colors.textDark};
  padding: 12px 24px;
  text-decoration: none;
  font-weight: 600;
  border-radius: 4px;
`

// Label (monospace, small)
export const labelStyle = `
  font-family: ${fonts.mono};
  font-size: 12px;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

// Large value (for prices, references)
export const valueStyle = `
  font-family: ${fonts.mono};
  font-size: 20px;
  font-weight: 700;
  color: ${colors.textDark};
`

// Footer
export const footerStyle = `
  text-align: center;
  padding-top: 32px;
  margin-top: 32px;
  border-top: 1px dashed ${colors.borderLight};
  color: ${colors.textMuted};
  font-size: 13px;
`
