import { useState, useCallback, useRef } from 'react'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'

interface ExportOptions {
  filename?: string
  /** Quality of image capture (0-1). Default 1 */
  quality?: number
  /** Pixels per point for the PDF. 2 = retina. Default 2 */
  scale?: number
}

/** Load an image from a data URL and return it once ready */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

/** Capture a single DOM element as a PNG data URL */
function captureElement(
  el: HTMLElement,
  opts: { quality: number; scale: number }
) {
  return toPng(el, {
    quality: opts.quality,
    pixelRatio: opts.scale,
    backgroundColor: getComputedStyle(el).backgroundColor || '#ffffff',
    filter: (node) => {
      if (node instanceof HTMLElement) {
        return !node.hasAttribute('data-pdf-exclude')
      }
      return true
    },
  })
}

export function useExportPdf(options: ExportOptions = {}) {
  const { filename = 'analytics', quality = 1, scale = 2 } = options
  const [exporting, setExporting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const exportPdf = useCallback(async () => {
    const el = contentRef.current
    if (!el) return

    setExporting(true)

    try {
      // Wait for animations to settle
      await new Promise((r) => setTimeout(r, 200))

      // A4 dimensions in mm
      const pageWidth = 210
      const pageHeight = 297
      const margin = 12
      const usableWidth = pageWidth - margin * 2
      const usableHeight = pageHeight - margin * 2

      // Find all sections marked as separate pages
      const pages = el.querySelectorAll<HTMLElement>('[data-pdf-page]')

      if (pages.length === 0) {
        // Fallback: capture entire content as single image
        const dataUrl = await captureElement(el, { quality, scale })
        const img = await loadImage(dataUrl)
        const pdf = new jsPDF('p', 'mm', 'a4')
        const fitWidth = usableWidth
        const fitHeight = fitWidth / (img.width / img.height)
        pdf.addImage(dataUrl, 'PNG', margin, margin, fitWidth, Math.min(fitHeight, usableHeight))
        pdf.save(`${filename}.pdf`)
        return
      }

      // Capture each section individually
      const pdf = new jsPDF('p', 'mm', 'a4')
      let isFirstPage = true

      for (const section of pages) {
        const dataUrl = await captureElement(section, { quality, scale })
        const img = await loadImage(dataUrl)

        const fitWidth = usableWidth
        const fitHeight = fitWidth / (img.width / img.height)

        if (!isFirstPage) pdf.addPage()
        isFirstPage = false

        if (fitHeight <= usableHeight) {
          // Fits on one page — center vertically
          const yOffset = margin + (usableHeight - fitHeight) / 2
          pdf.addImage(dataUrl, 'PNG', margin, Math.min(yOffset, margin), fitWidth, fitHeight)
        } else {
          // Section taller than a page — slice it
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          const srcPageHeight = (usableHeight / fitHeight) * img.height

          const totalSlices = Math.ceil(fitHeight / usableHeight)
          for (let s = 0; s < totalSlices; s++) {
            if (s > 0) pdf.addPage()

            const srcY = s * srcPageHeight
            const srcH = Math.min(srcPageHeight, img.height - srcY)
            const destH = (srcH / img.height) * fitHeight

            canvas.width = img.width
            canvas.height = srcH
            ctx.drawImage(img, 0, srcY, img.width, srcH, 0, 0, img.width, srcH)

            const sliceUrl = canvas.toDataURL('image/png')
            pdf.addImage(sliceUrl, 'PNG', margin, margin, fitWidth, destH)
          }
        }
      }

      pdf.save(`${filename}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExporting(false)
    }
  }, [filename, quality, scale])

  return { contentRef, exporting, exportPdf }
}
