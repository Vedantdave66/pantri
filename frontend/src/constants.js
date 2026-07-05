export const CATEGORIES = ['Produce', 'Meat', 'Dry Goods', 'Beverages', 'Cleaning']

export const UNCATEGORIZED = 'Uncategorized'

export function groupByCategory(items) {
  const groups = {}
  for (const item of items) {
    const key = item.category || UNCATEGORIZED
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  const order = [...CATEGORIES, UNCATEGORIZED]
  return Object.keys(groups)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map((category) => ({ category, items: groups[category] }))
}

export function formatToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}
