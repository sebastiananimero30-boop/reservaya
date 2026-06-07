import clsx from 'clsx'
import PropTypes from 'prop-types'

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={clsx('animate-spin rounded-full border-2 border-stone-200 border-t-primary-500', sizes[size], className)} />
  )
}

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
}
