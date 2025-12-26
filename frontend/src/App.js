import { useState, useMemo } from 'react';
import './App.css';

const API_BASE = 'https://something.trinitycorps.us/database';

/**
 * Utility function to format a number as USD currency.
 * @param {number} n - The amount to format
 * @returns {string} Formatted string, e.g., "$12.99"
 */
function currency(n) {
  return '$' + n.toFixed(2);
}

/**
 * Main POS (Point-of-Sale) application component.
 * Manages the checkout simulation with features:
 *   - Item scanning and adding to cart
 *   - Member card insertion with automatic discounts
 *   - Checkout and receipt display
 *
 * State variables track:
 *   - order: array of items in the current transaction
 *   - member: inserted member card (if any)
 *   - UI modals: signup form, receipt display
 */
function App() {
  // ============ State Management ============

  // Input for scanning/entering item IDs
  const [scanId, setScanId] = useState('');

  // Current order items: {id, name, price, qty, discounted?, discountedPrice?}
  const [order, setOrder] = useState([]);

  // Inserted member card (null if none): {id, name, discount, fuelPoints}
  const [member, setMember] = useState(null);

  // UI modal visibility flags
  const [showSignup, setShowSignup] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // Form fields for member signup
  const [newMemberFirstName, setNewMemberFirstName] = useState('');
  const [newMemberLastName, setNewMemberLastName] = useState('');
  const [newMemberPhoneNumber, setNewMemberPhoneNumber] = useState('');

  // Status messages for API calls (displayed in navbar)
  const [statusMsg, setStatusMsg] = useState('');

  // Stored age of the customer.
  const [customerAge, setCustomerAge] = useState(-1);

  // ============ Computed Values (Memoized) ============

  // Subtotal before discounts
  const subtotal = useMemo(() => order.reduce((s,it)=>s+it.price*it.qty,0), [order]);

  // Total discount amount across all items
  const discountTotal = useMemo(() => order.reduce((s,it)=>s+((it.price - (it.discountedPrice ?? it.price)) * it.qty),0), [order]);

  // Final total after applying discounts
  const total = subtotal - discountTotal;

  /**
   * Add an item to the order by ID.
   * If member is inserted, applies discount to the new item immediately.
   * If item already in order, increments quantity instead of duplicating.
   *
   * @param {string} id - Product ID to add
   */
  function addItemById(id) {
    if (!id) return;
    setStatusMsg('Fetching item from backend...');
    fetch(`${API_BASE}/getItem/${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => {
        if (!data || !data.name) {
          // Item not found.
          setStatusMsg('Item not found.');
        } else {
          if (data.minAge > 0 && customerAge < 0) {
            const age = Number.parseInt(window.prompt("Enter the customer's age: "));
            setCustomerAge(age);
            if (age < data.minAge) {
               setStatusMsg("Customer is too young to purchase this item.");
              // Reset customer age in case of a typo.
              setCustomerAge(-1);
              return;
            }
          }
          else if (data.minAge > 0 && customerAge < data.minAge) {
            setStatusMsg("Customer is too young to purchase this item.");
            // Reset customer age in case of a typo.
            setCustomerAge(-1);
            return;
          }

          // Parse price from backend response (could be BigDecimal or string)
          const price = parseFloat(data.price || data.price?.toString?.() || 0) || 0;
          setOrder(o => {
            // Create new item with current price
            const item = { id: data.id?.toString() || id, name: data.name, price, qty: 1, discounted: false, memberSale: data.memberSale };
            const existing = o.find(x => x.id === id && !x.placeholder);
            // If item already in order, increment qty
            if (existing) {
              return o.map(x => {
                const priceMod = x.memberSale ? (x.qty + 1 >= x.memberSale.requiredAmount ? x.memberSale.priceModifier : 1) : 1;
                const discountedPrice = +(x.price * priceMod).toFixed(2);
                return {...x, qty: (x.id === id ? x.qty + 1 : x.qty), discounted: discountedPrice < x.price, discountedPrice};
              });

              //return o.map(x => x.id === id ? { ...x, qty: x.qty + 1 } : x);
            }
            // Create new item with current price
            // If member inserted, apply discount retroactively
            if (member) {
              const priceMod = data.memberSale ? (item.qty >= data.memberSale.requiredAmount ? data.memberSale.priceModifier : 1) : 1;
              const discountedPrice = +(price * priceMod).toFixed(2);
              item.discounted = discountedPrice < price;
              item.discountedPrice = discountedPrice;
            }
            return [...o, item];
          });
          setStatusMsg('Item added.');
        }
      })
      .catch(() => {
        setStatusMsg('Item not found.');
      })
      .finally(() => setScanId(''));
    return;
  }

  /**
   * Remove an item from the order by index.
   *
   * @param {number} index - Position of the item to remove
   */
  function removeItem(index) {
    setOrder(o => o.filter((_,i) => i !== index));
  }

  /**
   * Insert a member card and apply discounts retroactively.
   * Updates all items in the current order to reflect the member's discount.
   *
   * @param {object} memberObj - Member object {id, name, discount, fuelPoints}
   */
  function insertCard(memberObj) {
    // sets current member and retroactively applies discount to current order
    setMember(memberObj);
    setOrder(o => o.map(it => {
      const priceMod = it.memberSale ? (it.qty >= it.memberSale.requiredAmount ? it.memberSale.priceModifier : 1) : 1;
      const discountedPrice = +(it.price * priceMod).toFixed(2);
      return {...it, discounted: discountedPrice < it.price, discountedPrice};
    }));
  }

  /**
   * Handle member signup form submission.
   *
   * @param {event} e - Form submission event
   */
  function handleSignup(e) {
    e.preventDefault();
    if (!newMemberFirstName || !newMemberLastName || !newMemberPhoneNumber) return;
    // Backend expects Member object with at least firstName, lastName, phoneNumber
    const payload = { firstName: newMemberFirstName, lastName: newMemberLastName, phoneNumber: Number(newMemberPhoneNumber)};
    setStatusMsg('Creating member on backend...');
    fetch(`${API_BASE}/addMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.text())
      .then(txt => {
        setStatusMsg('Member creation response: ' + txt);
        // Attempt to fetch the created member by phone number
        fetch(`${API_BASE}/getMemberByPhone/${payload.phoneNumber}`)
          .then(r => r.json())
          .then(m => {
            if (m) {
              // Map backend Member to frontend member object
              const frontendMember = {
                id: m.cardId?.toString?.(),
                name: `${m.firstName} ${m.lastName || ''}`.trim(),
                currentMonthFuelPoints: m.currentMonthFuelPoints,
                lastMonthFuelPoints: m.lastMonthFuelPoints
              };
              insertCard(frontendMember);
            }
          })
          .catch(()=>{});
      })
      .catch(()=> setStatusMsg('Failed to create member on backend.'))
      .finally(()=>{ setShowSignup(false); setNewMemberFirstName(''); setNewMemberLastName(""); setNewMemberPhoneNumber("")});
    return;
  }

  /**
   * Open the receipt modal when user clicks Checkout.
   */
  function handleCheckout() {
    setShowReceipt(true);
  }

  /**
   * Finalize the transaction:
   *   - Award fuel points to member (1 point per dollar spent)
   *   - Clear the order
   *   - Close the receipt modal
   *   - Remove inserted card
   */
  function confirmAndClear() {
    // Add fuel points if member is inserted
    if (member) {
      const points = Math.ceil(total);
      member.currentMonthFuelPoints += points;
      setMember({...member});
      fetch(`${API_BASE}/givePoints/${member.id}/${points}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: "{}"
      });
    }
    // Clear order and close receipt
    setOrder([]);
    setShowReceipt(false);
    // Remove card after transaction to simulate card removal
    setMember(null);
  }


  /**
   * Generate the string to place in the receipt regarding fuel points.
   *
   * @param {*} member Current member (null if no card was scanned).
   * @returns String detailing fuel point information, or an empty string if member was null.
   */
  function formatFuelPoints(member) {
    if (!member) {
      return "";
    }
    return `Fuel Points: ${Math.ceil(total)}/${member.currentMonthFuelPoints + Math.ceil(total)}/${member.lastMonthFuelPoints}`;
  }

  // ============ Render: Main Layout ============

  return (
    <div className="AppRoot">
      <nav className="NavBar">
        <div className="NavLeft">
          <h1 className="Brand">Dingles Checkout Simulator</h1>
        </div>
        <div className="NavRight">
          {/* Status Display */}
          <div className="ModeSwitch">
            <div style={{marginLeft:12, fontSize:12, color:'#bcd'}}> {statusMsg} </div>
          </div>
          {/* Member Card Information */}
          <div className="MemberInfo">
            {member ? (
              <>
                <div className="MemberName">{member.name} <span className="MemberId">#{member.id}</span></div>
                <div className="MemberPoints">Fuel pts: {member.currentMonthFuelPoints ?? 0 + member.lastMonthFuelPoints ?? 0}</div>
              </>
            ) : (
              <div className="NoMember">No card inserted</div>
            )}
          </div>
          {/* Checkout Button (top-right) */}
          <div className="CheckoutWrap">
            <button className="IconButton CheckoutBtn" title="Checkout" onClick={handleCheckout}>
              <img src="/favicon.ico" alt="checkout" className="IconImg"/>
            </button>
          </div>
        </div>
      </nav>

      <main className="Main">
        {/* ============ SCAN PANEL: Left Column ============ */}
        <section className="ScanPanel">
          <h2>Scan / Enter Item ID</h2>
          <div className="ScanRow">
            {/* Input field for item IDs */}
            <input
              value={scanId}
              onChange={e => setScanId(e.target.value)}
              placeholder="Enter item ID (e.g. 1001)"
            />
            {/* Add item to order */}
            <button onClick={() => addItemById(scanId)}>Add</button>
            {/* Open member signup modal */}
            <button onClick={() => { setShowSignup(true); }}>Sign up for card</button>
            {/* Insert existing member card */}
            <button onClick={() => {
              const ask = window.prompt('Enter member card ID or phone number:');
              if (!ask) return;
              setStatusMsg('Fetching member from backend...');
              fetch(`${API_BASE}/getMember/${encodeURIComponent(ask)}`)
                .then(r => r.json())
                .then(m => {
                  if (!m) { setStatusMsg('Member not found'); return; }
                  const frontendMember = {
                    id: m.cardId?.toString?.(),
                    name: `${m.firstName} ${m.lastName || ''}`.trim(),
                    currentMonthFuelPoints: m.currentMonthFuelPoints,
                    lastMonthFuelPoints: m.lastMonthFuelPoints
                  };
                  insertCard(frontendMember);
                  setStatusMsg('Member inserted from backend');
                })
                .catch(()=> {
                  fetch(`${API_BASE}/getMemberByPhone/${encodeURIComponent(ask)}`)
                    .then(r => r.json())
                    .then(m => {
                        if (!m) { setStatusMsg("Member not found."); return;}
                        const frontendMember = {
                          id: m.cardId?.toString?.(),
                          name: `${m.firstName} ${m.lastName || ''}`.trim(),
                          currentMonthFuelPoints: m.currentMonthFuelPoints,
                          lastMonthFuelPoints: m.lastMonthFuelPoints
                        };
                        insertCard(frontendMember);
                        setStatusMsg("Member inserted from backend.");
                    })
                    .catch(() => setStatusMsg("Member not found."));

                });
              return;
            }}>Insert Card</button>
          </div>

          {/* ============ ORDER LIST ============ */}
          <div className="OrderList">
            <h3>Current Order</h3>
            {order.length === 0 && <div className="Empty">No items scanned yet.</div>}
            <ul>
              {order.map((it, idx) => (
                <li key={idx} className="OrderItem">
                  <div className="ItemMain">
                    <div className="ItemName">{it.name}</div>
                    <div className="ItemQty">x{it.qty}</div>
                  </div>
                  {/* Display price (with discount if applicable) */}
                  <div className="ItemPrice">
                    {it.discounted ? (
                      <div className="DiscountedPrices">
                        <span className="OrigPrice">{currency(it.price)}</span>
                        <span className="NewPrice">{currency(it.discountedPrice)}</span>
                      </div>
                    ) : (
                      <div className="Price">{currency(it.price)}</div>
                    )}
                  </div>
                  {/* Remove item button */}
                  <button className="RemoveBtn" onClick={() => removeItem(idx)}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============ SUMMARY PANEL: Right Column ============ */}
        <aside className="SummaryPanel">
          <h3>Summary</h3>
          {/* Price breakdown */}
          <div className="SummaryRow"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
          <div className="SummaryRow"><span>Discounts</span><span>-{currency(discountTotal)}</span></div>
          <div className="SummaryRow total"><span>Total</span><span>{currency(total)}</span></div>
          {/* Action buttons */}
          <div className="SummaryActions">
            <button className="Primary" onClick={handleCheckout} disabled={order.length===0}>Checkout</button>
            <button onClick={() => { setOrder([]); }}>Clear</button>
          </div>
        </aside>
      </main>

      <footer className="Footer">
        <div>© Dingles University Demo</div>
      </footer>

      {/* ============ MODAL: Member Signup Form ============ */}
      {showSignup && (
        <div className="ModalOverlay" onClick={() => setShowSignup(false)}>
          <div className="Modal" onClick={e => e.stopPropagation()}>
            <h3>Sign up for a card</h3>
            <form onSubmit={handleSignup}>
              <label>First Name</label>
              <input
                value={newMemberFirstName}
                onChange={e => setNewMemberFirstName(e.target.value)}
                placeholder="First Name"
                required
              />
              <label>Last Name</label>
              <input
                value={newMemberLastName}
                onChange={e => setNewMemberLastName(e.target.value)}
                placeholder="Last Name"
                required
              />
              <label>Phone Number</label>
              <input
                value={newMemberPhoneNumber}
                onChange={e => setNewMemberPhoneNumber(e.target.value)}
                placeholder="e.g. 1234567890"
                required
              />
              <div className="ModalActions">
                <button type="submit" className="Primary">Create & Insert Card</button>
                <button type="button" onClick={() => setShowSignup(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ MODAL: Receipt / Checkout Summary ============ */}
      {showReceipt && (
        <div className="ModalOverlay" onClick={() => setShowReceipt(false)}>
          <div className="Modal Receipt" onClick={e => e.stopPropagation()}>
            <h3>Receipt</h3>
            <div className="ReceiptBody">
              {/* Itemized receipt */}
              <ul>
                {order.map((it, idx) => (
                  <li key={idx} className="ReceiptItem">
                    <div className="RName">{it.name} x{it.qty}</div>
                    <div className="RPrice">{currency((it.discountedPrice ?? it.price) * it.qty)}</div>
                  </li>
                ))}
              </ul>
              {/* Receipt summary */}
              <div className="ReceiptSummary">
                <div><span>Subtotal:</span><span>{currency(subtotal)}</span></div>
                <div><span>Discounts:</span><span>-{currency(discountTotal)}</span></div>
                <div className="TotalRow"><span>Total:</span><span>{currency(total)}</span></div>
                {/* Fuel points earned from this purchase (1 point per dollar) */}
                <div className="Points">{formatFuelPoints(member)}</div>
              </div>
            </div>
            <div className="ModalActions">
              {/* Confirm purchase and reset for next transaction */}
              <button className="Primary" onClick={confirmAndClear}>Confirm & Clear</button>
              {/* Close without confirming */}
              <button onClick={() => setShowReceipt(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/**
 * Export the App component as the default export.
 * This component is the root of the React application.
 */
export default App;