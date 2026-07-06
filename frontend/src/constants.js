export const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Dry Goods', 'Beverages', 'Cleaning']

export const CATEGORY_COLORS = {
  Produce: '#2D6A4F',
  Dairy: '#F4A535',
  Meat: '#C1121F',
  'Dry Goods': '#E76F51',
  Beverages: '#457B9D',
  Cleaning: '#6B6B6B',
  Uncategorized: '#A0A0A0',
}

export const UNCATEGORIZED = 'Uncategorized'

export function categoryColor(category) {
  return CATEGORY_COLORS[category || UNCATEGORIZED] || CATEGORY_COLORS.Uncategorized
}

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

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function initials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function timeAgo(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
