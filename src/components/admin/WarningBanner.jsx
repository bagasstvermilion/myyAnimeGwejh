import warningIcon from '../../assets/img/warning.png'

export default function WarningBanner({ message = 'Gunakan fitur dengan hati-hati!' }) {
  return (
    <div className="mt-5 flex items-center gap-2">
      <span
        aria-hidden
        className="h-5 w-5 shrink-0 bg-red-500"
        style={{
          WebkitMaskImage: `url(${warningIcon})`,
          maskImage: `url(${warningIcon})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
      <p className="text-xs font-medium text-red-500">{message}</p>
    </div>
  )
}
