// thin gradient border (matches the sakura logo's pink -> violet), with a
// transparent-looking fill — the inner layer just matches the page
// background (#fafafa) by default, so it reads as "see-through"
export function gradientBorderStyle(innerFill = '#fafafa') {
  return {
    border: '1.5px solid transparent',
    backgroundImage: `linear-gradient(${innerFill}, ${innerFill}), linear-gradient(135deg, #f472b6, #7c3aed)`,
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box',
  }
}
