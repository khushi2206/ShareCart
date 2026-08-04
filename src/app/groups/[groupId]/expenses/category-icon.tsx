import { Category } from '@prisma/client'
import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function CategoryIcon({
  category,
  className,
  ...props
}: { category: Category | null } & HTMLAttributes<HTMLSpanElement>) {
  const emoji = getCategoryIcon(`${category?.grouping}/${category?.name}`)
  return (
    <span className={cn('inline-flex items-center justify-center', className)} {...props}>
      {emoji}
    </span>
  )
}

function getCategoryIcon(category: string): string {
  if (category.startsWith('Food and Drink/')) {
    if (category.includes('Groceries') || category.includes('Liquor')) return '🛒'
    return '🍔'
  }
  if (category.startsWith('Home/')) {
    if (category.includes('Rent') || category.includes('Mortgage') || category.includes('Home')) return '🏠'
    return '📦'
  }
  if (category.startsWith('Utilities/')) return '💡'
  if (category.startsWith('Transportation/')) return '🚕'
  if (category.startsWith('Entertainment/')) return '🎉'
  if (category.includes('Education')) return '📚'
  if (category.includes('Medical')) return '💊'
  if (category.startsWith('Life/')) {
    if (category.includes('Clothing') || category.includes('Gifts')) return '📦'
  }
  return '📌'
}
