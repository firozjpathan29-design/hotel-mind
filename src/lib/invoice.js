// src/lib/invoice.js — Phase 3

export function generateInvoiceNumber() {
  const n = new Date()
  const yy = n.getFullYear().toString().slice(-2)
  const mm = String(n.getMonth() + 1).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return 'HM-' + yy + mm + '-' + seq
}

export function printInvoice(inv) {
  const extras = (inv.extras || []).map(function(e) {
    return '<tr><td>' + e.description + '</td><td style="text-align:right">Rs.' + e.amount.toLocaleString('en-IN') + '</td></tr>'
  }).join('')

  const html = '<!DOCTYPE html>' +
    '<html><head><meta charset="UTF-8"><title>Invoice ' + inv.invoiceNumber + '</title>' +
    '<style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{font-family:Arial,sans-serif;font-size:13px;color:#1A1A18;padding:40px}' +
    '.hdr{display:flex;justify-content:space-between;margin-bottom:24px}' +
    '.hn{font-size:22px;font-weight:700}' +
    '.hsub{font-size:12px;color:#888;margin-top:4px;line-height:1.6}' +
    '.inv-num{font-size:18px;font-weight:700}' +
    'hr{border:none;border-top:0.5px solid #ddd;margin:16px 0}' +
    '.two{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:20px}' +
    '.lbl{font-size:11px;color:#888;text-transform:uppercase;margin-bottom:6px}' +
    '.val{font-size:13px;line-height:1.7}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:16px}' +
    'th{background:#F5F4F0;padding:9px 12px;text-align:left;font-size:12px;color:#888}' +
    'td{padding:9px 12px;border-bottom:0.5px solid #f0ede8}' +
    '.tot{width:300px;margin-left:auto}' +
    '.tot-final{font-weight:700;font-size:15px}' +
    '.paid{background:#E1F5EE;color:#085041;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700;display:inline-block}' +
    '.foot{text-align:center;margin-top:32px;font-size:11px;color:#aaa}' +
    '</style></head><body>' +

    '<div class="hdr">' +
      '<div>' +
        '<div class="hn">' + (inv.hotelName || 'Hotel') + '</div>' +
        '<div class="hsub">' + (inv.hotelAddress || '') + '<br>Tel: ' + (inv.hotelPhone || '') + '<br>GST: ' + (inv.hotelGST || 'N/A') + '</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-size:11px;color:#888">INVOICE</div>' +
        '<div class="inv-num">#' + inv.invoiceNumber + '</div>' +
        '<div style="font-size:12px;color:#888;margin-top:2px">' + inv.date + '</div>' +
        '<div style="margin-top:8px"><span class="paid">PAID</span></div>' +
      '</div>' +
    '</div>' +

    '<hr>' +

    '<div class="two">' +
      '<div>' +
        '<div class="lbl">Bill To</div>' +
        '<div class="val"><strong>' + inv.guestName + '</strong><br>' + (inv.guestPhone || '') + '<br>' + (inv.guestEmail || '') + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="lbl">Stay Details</div>' +
        '<div class="val">Room ' + inv.roomNumber + ' — ' + inv.roomType + '<br>' +
        'Check-in: <strong>' + inv.checkIn + '</strong><br>' +
        'Check-out: <strong>' + inv.checkOut + '</strong><br>' +
        'Duration: <strong>' + inv.nights + ' raat</strong></div>' +
      '</div>' +
    '</div>' +

    '<table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>' +
    '<tbody>' +
      '<tr><td>Room ' + inv.roomNumber + ' x ' + inv.nights + ' raat @ Rs.' + (inv.pricePerNight || 0).toLocaleString('en-IN') + '/raat</td>' +
      '<td style="text-align:right">Rs.' + ((inv.pricePerNight || 0) * inv.nights).toLocaleString('en-IN') + '</td></tr>' +
      extras +
    '</tbody></table>' +

    '<table class="tot"><tbody>' +
      '<tr><td style="color:#888">Subtotal</td><td style="text-align:right">Rs.' + (inv.subtotal || 0).toLocaleString('en-IN') + '</td></tr>' +
      '<tr><td style="color:#888">GST (' + (inv.gstRate || 0) + '%)</td><td style="text-align:right">Rs.' + (inv.gstAmount || 0).toLocaleString('en-IN') + '</td></tr>' +
      '<tr class="tot-final"><td>Total</td><td style="text-align:right">Rs.' + (inv.total || 0).toLocaleString('en-IN') + '</td></tr>' +
    '</tbody></table>' +

    '<div style="background:#F5F4F0;padding:10px 14px;border-radius:8px;font-size:12px;color:#888;margin-top:16px">' +
      'Payment: ' + (inv.paymentMode || 'Online') +
      (inv.paymentId ? ' &nbsp;·&nbsp; TxnID: ' + inv.paymentId : '') +
      ' &nbsp;·&nbsp; <span class="paid">PAID</span>' +
    '</div>' +

    '<div class="foot">Thank you for choosing ' + (inv.hotelName || 'Hotel') + '! &nbsp;·&nbsp; HotelMind AI</div>' +
    '</body></html>'

  const w = window.open('', '_blank', 'width=800,height=900')
  w.document.write(html)
  w.document.close()
  w.onload = function() { w.print() }
}
