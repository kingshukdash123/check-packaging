import React, { useState, useRef, useEffect } from 'react';

export default function ChatAssistant({ activeReport, onShowToast }) {
  const [messages, setMessages] = useState([
    {
      id: 'default-1',
      sender: 'user',
      text: 'Why did this product fail?',
      timestamp: 'Just now'
    },
    {
      id: 'default-2',
      sender: 'bot',
      text: 'The automated screening identified potential compliance issues:\n• Consumer care contact details could not be verified on the rear panel under Rule 6(1)(n).\n• A possible net-quantity font height deficit was detected under Rule 6(1)(e).\n\nBoth items require officer verification before finalizing statutory penal notice.',
      timestamp: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle generating context-aware answers based on activeReport
  const generateBotReply = (query) => {
    const q = query.toLowerCase();
    const rules = activeReport?.rule_results || [];
    const fails = rules.filter(r => r.status === 'FAIL');
    const warns = rules.filter(r => r.status === 'WARNING');
    const passes = rules.filter(r => r.status === 'PASS');
    const prod = activeReport?.product_name || 'Kurkure Masala Munch';

    if (q.includes('why') && (q.includes('fail') || q.includes('violation'))) {
      if (fails.length > 0) {
        const list = fails.map(f => `• ${f.rule_name} (${f.legal_reference}): ${f.description || 'Statutory requirement not met.'} (Declared: ${f.declared_value || 'None'}, Standard: ${f.expected_standard || 'Required'})`).join('\n');
        return `Automated screening flagged ${fails.length} violation(s) on ${prod}:\n${list}\n\nUnder Section 36 of Legal Metrology Act, 2009, non-conforming packaging may invite compoundable compounding or statutory notices.`;
      }
      return `No critical non-compliance violations were confirmed on ${prod}. It scored ${activeReport?.compliance_score || 82}% compliance under PCR 2011.`;
    }

    if (q.includes('missing') || q.includes('absent')) {
      const missingFields = rules.filter(r => (r.status === 'FAIL' || r.status === 'WARNING') && (r.declared_value === 'Missing' || !r.declared_value || r.description?.toLowerCase().includes('missing')));
      if (missingFields.length > 0) {
        return `Missing or occluded mandatory declarations:\n${missingFields.map(m => `• ${m.rule_name} (${m.legal_reference}): ${m.description}`).join('\n')}`;
      }
      return `Mandatory PCR Rule 6 declarations (Name, Net Qty, MRP, Mfg/Packing Date, Origin, Manufacturer Address) are present. Review consumer care channels for complete compliance.`;
    }

    if (q.includes('mrp') || q.includes('price')) {
      const mrpRule = rules.find(r => r.rule_id === 'RULE_6_1_E_MRP' || r.rule_name?.toLowerCase().includes('mrp'));
      const mrpVal = activeReport?.extracted_data?.mrp_text || '₹20 (incl. of taxes)';
      return `MRP Compliance Review:\n• Extracted: "${mrpVal}"\n• Rule 6(1)(e) requires Maximum Retail Price to be stated clearly inclusive of all taxes ("incl. of all taxes").\n• Status: ${mrpRule ? mrpRule.status : 'PASS'}. Ensure the price print font complies with Schedule II minimum numeral heights.`;
    }

    if (q.includes('warning') || q.includes('review')) {
      if (warns.length > 0) {
        return `Items requiring manual officer review:\n${warns.map(w => `• ${w.rule_name} (${w.legal_reference}): ${w.description || 'OCR ambiguity detected'}`).join('\n')}\n\nPhysical packaging examination is recommended.`;
      }
      return `No ambiguous OCR warnings were triggered for ${prod}. All evaluated fields resolved deterministically.`;
    }

    if (q.includes('passed') || q.includes('compliant') || q.includes('pass')) {
      return `Statutory checks passed (${passes.length || 10} rules):\n• Country of Origin declaration (Rule 6(10))\n• Manufacturer name & registered premise address (Rule 6(1)(a))\n• Metric unit symbols conform to Eighth Schedule (Rule 13)\n• Maximum Retail Price taxes declaration (Rule 6(1)(e))\n• Standard packaging commodity labeling.`;
    }

    if (q.includes('usp') || q.includes('unit sale price')) {
      const usp = activeReport?.usp_check;
      if (usp) {
        return `USP Engine Analysis under Rule 6(11):\n• Declared USP: ₹${usp.declared_usp || 'N/A'}\n• Calculated Standard USP: ₹${usp.calculated_usp || 'N/A'} per ${usp.basis_unit || 'g'}\n• Mathematical Discrepancy: ${usp.is_accurate ? '0.00% (Accurate)' : `₹${Math.abs(usp.discrepancy || 0)} disparity detected.`}\n${usp.notes || ''}`;
      }
      return `For pre-packaged commodities exceeding 100g or 100ml, Rule 6(11) of Legal Metrology (Packaged Commodities) Rules mandates conspicuous Unit Sale Price calculated to the nearest 2 decimal places.`;
    }

    return `Query received: "${query}". Based on Legal Metrology (Packaged Commodities) Rules 2011 and Section 18 of the Legal Metrology Act, 2009, all pre-packaged commodities must display unoccluded, legible statutory declarations. Check the Evidence Inspector for coordinate overlays.`;
  };

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      const botResponse = generateBotReply(text.trim());
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponse,
        timestamp: 'Just now'
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  const quickQueries = [
    'Why did this fail?',
    'What is missing?',
    'Explain the MRP issue?',
    'Show warnings',
    'Show passed checks',
    'USP math breakdown'
  ];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary">chat</span>
          <span>Ask about this inspection</span>
        </h4>
        <span className="text-[11px] text-outline font-medium">Enforcement AI Assistant</span>
      </div>

      {/* Quick query suggestion pills */}
      <div className="flex flex-wrap gap-1.5">
        {quickQueries.map((query, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(query)}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container hover:bg-surface-container-highest text-on-surface transition-colors cursor-pointer"
          >
            {query}
          </button>
        ))}
      </div>

      {/* Conversation exchange scroll area */}
      <div className="space-y-3 pt-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
        {messages.map((msg) =>
          msg.sender === 'user' ? (
            <div key={msg.id} className="flex justify-end">
              <div className="bg-primary text-surface-container-lowest rounded-lg px-3.5 py-2 text-xs max-w-md shadow-sm">
                <p className="font-semibold text-primary-fixed text-[10px] mb-0.5">Enforcement Officer</p>
                <p>{msg.text}</p>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary text-surface-container-lowest flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <span className="material-symbols-outlined text-sm">policy</span>
              </div>
              <div className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-xs text-on-surface leading-relaxed max-w-xl space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-primary tracking-wide">LEGAL METROLOGY AI</span>
                  <span className="text-[10px] text-outline">{msg.timestamp}</span>
                </div>
                <p className="whitespace-pre-line text-on-surface leading-relaxed">{msg.text}</p>
              </div>
            </div>
          )
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Chat Input Bar */}
      <form
        className="flex items-center gap-2 pt-2 border-t border-outline-variant/20"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about this inspection, penalty rules, or mandatory declarations..."
          className="flex-1 bg-surface-container-low border border-outline-variant/50 rounded-lg px-3.5 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
        />
        <button
          type="submit"
          className="h-8 px-3.5 rounded bg-primary text-surface-container-lowest font-bold text-xs flex items-center gap-1 hover:bg-on-primary-fixed-variant transition-colors shadow-sm cursor-pointer"
        >
          <span>Send</span>
          <span className="material-symbols-outlined text-xs">send</span>
        </button>
      </form>
    </div>
  );
}
