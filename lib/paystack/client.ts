export function loadPaystackInline(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve()
    if ((window as any).PaystackPop) return resolve()
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = (e) => reject(e)
    document.head.appendChild(s)
  })
}

export function openPaystackInline({ key, email, amount, reference, onSuccess, onClose }: { key: string, email: string, amount: number, reference: string, onSuccess: (res: any) => void, onClose?: () => void }) {
  if (typeof window === 'undefined' || !(window as any).PaystackPop) throw new Error('Paystack not loaded')
  const handler = (window as any).PaystackPop.setup({
    key,
    email,
    amount: Math.round(amount),
    ref: reference,
    onClose: onClose || (() => {}),
    callback: function (response: any) {
      onSuccess(response)
    }
  })
  handler.openIframe()
}
