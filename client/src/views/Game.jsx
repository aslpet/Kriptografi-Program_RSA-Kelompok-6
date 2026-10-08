import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { request } from '../lib/api.js';
import { validateDigits, validateField } from '@topup/shared';
import { useCryptoLog } from '../context/CryptoLogContext.jsx';
import { executeCheckout } from '../lib/checkout.js';
import { AccountForm } from '../components/AccountForm.jsx';
import { DenominationPicker } from '../components/DenominationPicker.jsx';
import { PaymentPicker } from '../components/PaymentPicker.jsx';
import { OrderSummary } from '../components/OrderSummary.jsx';

export function Game() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { log, setLastPacket, setDockOpen } = useCryptoLog();

  const [catalogData, setCatalogData] = useState(null);
  const [loading, setLoading] = useState(true);

  // State form checkout — default kosong tanpa data tiruan
  const [accountValues, setAccountValues] = useState({});
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ewallet');
  const [payNo, setPayNo] = useState('');
  const [pin, setPin] = useState('');

  // Pelacakan field yang sudah disentuh (touched) untuk validasi inline
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [checkoutStatus, setCheckoutStatus] = useState('idle');
  const [serverError, setServerError] = useState(null);

  // Ambil katalog game
  useEffect(() => {
    request('/api/catalog')
      .then(data => {
        setCatalogData(data);
        const game = data?.games?.find(g => g.id === id);
        if (game && game.items?.length > 0) {
          setSelectedItemId(game.items[0].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // Reset form saat berpindah game
  useEffect(() => {
    setAccountValues({});
    setPayNo('');
    setPin('');
    setTouched({});
    setServerErrors({});
    setServerError(null);
  }, [id]);

  const currentGame = useMemo(() => {
    return catalogData?.games?.find(g => g.id === id) || null;
  }, [catalogData, id]);

  const currentItem = useMemo(() => {
    return currentGame?.items?.find(i => i.id === selectedItemId) || null;
  }, [currentGame, selectedItemId]);

  const currentMethod = useMemo(() => {
    return catalogData?.paymentMethods?.find(m => m.id === selectedMethod) || null;
  }, [catalogData, selectedMethod]);

  // Evaluasi seluruh error secara reaktif
  const allErrors = useMemo(() => {
    const errs = {};

    if (currentGame?.fields) {
      for (const f of currentGame.fields) {
        const key = typeof f === 'string' ? f : f.key;
        const val = accountValues[key] || '';
        if (typeof f === 'object') {
          const e = validateDigits(val, f);
          if (e) errs[key] = e;
        } else {
          const e = validateField(key, val);
          if (e) errs[key] = e;
        }
      }
    }

    if (selectedMethod === 'ewallet') {
      const e = validateField('payNo', payNo);
      if (e) errs.payNo = e;
    } else if (selectedMethod === 'saldo') {
      const e = validateField('pin', pin);
      if (e) errs.pin = e;
    }

    return errs;
  }, [currentGame, accountValues, selectedMethod, payNo, pin]);

  // Error yang ditampilkan ke user (hanya jika sudah disentuh atau disubmit)
  const displayErrors = useMemo(() => {
    const out = { ...serverErrors };
    for (const [key, msg] of Object.entries(allErrors)) {
      if (touched[key]) {
        out[key] = msg;
      }
    }
    return out;
  }, [allErrors, touched, serverErrors]);

  const canSubmit = useMemo(() => {
    return (
      Boolean(currentItem) &&
      Boolean(currentMethod) &&
      Object.keys(allErrors).length === 0
    );
  }, [currentItem, currentMethod, allErrors]);

  const handleFieldChange = useCallback((key, value) => {
    setAccountValues(prev => ({ ...prev, [key]: value }));
    setServerErrors(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  }, []);

  const handleFieldBlur = useCallback((key) => {
    setTouched(prev => ({ ...prev, [key]: true }));
  }, []);

  const handleMethodSelect = useCallback((methodId) => {
    setSelectedMethod(methodId);
    setTouched(prev => {
      const copy = { ...prev };
      delete copy.payNo;
      delete copy.pin;
      return copy;
    });
    setServerErrors(prev => {
      const copy = { ...prev };
      delete copy.payNo;
      delete copy.pin;
      return copy;
    });
  }, []);

  const handleCheckout = async () => {
    // Tandai semua field sebagai touched agar error terlihat jika ada yang kosong
    const allTouched = {};
    if (currentGame?.fields) {
      for (const f of currentGame.fields) {
        allTouched[typeof f === 'string' ? f : f.key] = true;
      }
    }
    if (selectedMethod === 'ewallet') allTouched.payNo = true;
    if (selectedMethod === 'saldo') allTouched.pin = true;
    setTouched(allTouched);

    if (Object.keys(allErrors).length > 0) {
      return;
    }

    setServerError(null);
    setServerErrors({});

    try {
      setCheckoutStatus('encrypting');
      setDockOpen(true); // Buka dock otomatis agar user dapat melihat transmisi kripto

      const formPayload = {
        gameId: currentGame.id,
        itemId: currentItem.id,
        playerId: accountValues.playerId || '',
        zoneId: accountValues.zoneId || '',
        method: selectedMethod,
        payNo,
        pin
      };

      setCheckoutStatus('sending');
      const response = await executeCheckout(formPayload, {
        onLog: log,
        setLastPacket
      });

      setCheckoutStatus('idle');
      navigate(`/receipt/${response.order.id}`);
    } catch (err) {
      setCheckoutStatus('error');
      setServerError(err.message || 'Terjadi kesalahan saat checkout');

      // Jika server mengembalikan detail error per-field (422)
      if (err.errors && Array.isArray(err.errors)) {
        const sErrs = {};
        for (const e of err.errors) {
          if (e.field) sErrs[e.field] = e.message;
        }
        setServerErrors(sErrs);
      }
    }
  };

  if (loading) {
    return (
      <div className="store-container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ color: 'var(--muted)' }}>Memuat detail game...</div>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="store-container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <h2>Game Tidak Ditemukan</h2>
      </div>
    );
  }

  return (
    <div className="store-container">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text)', marginBottom: '4px' }}>
          Top Up {currentGame.name}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
          Isi data akun, pilih nominal {currentGame.currencyName}, dan selesaikan pembayaran.
        </p>
      </div>

      <div className="store-grid">
        <main>
          {/* 1. Data Akun */}
          <section className="flow-section">
            <div className="flow-header">
              <div className="flow-number">1</div>
              <h2 className="flow-title">Masukkan Data Akun</h2>
            </div>
            <AccountForm
              fields={currentGame.fields}
              values={accountValues}
              onChangeField={handleFieldChange}
              onBlurField={handleFieldBlur}
              errors={displayErrors}
            />
          </section>

          {/* 2. Pilih Nominal */}
          <section className="flow-section">
            <div className="flow-header">
              <div className="flow-number">2</div>
              <h2 className="flow-title">Pilih Nominal Top Up</h2>
            </div>
            <DenominationPicker
              items={currentGame.items}
              selectedItemId={selectedItemId}
              onSelect={setSelectedItemId}
            />
          </section>

          {/* 3. Pilih Pembayaran */}
          <section className="flow-section">
            <div className="flow-header">
              <div className="flow-number">3</div>
              <h2 className="flow-title">Pilih Metode Pembayaran</h2>
            </div>
            <PaymentPicker
              methods={catalogData?.paymentMethods || []}
              selectedMethod={selectedMethod}
              onSelectMethod={handleMethodSelect}
              payNo={payNo}
              onChangePayNo={setPayNo}
              onBlurPayNo={() => handleFieldBlur('payNo')}
              pin={pin}
              onChangePin={setPin}
              onBlurPin={() => handleFieldBlur('pin')}
              errors={displayErrors}
            />
          </section>
        </main>

        <OrderSummary
          game={currentGame}
          item={currentItem}
          method={currentMethod}
          status={checkoutStatus}
          canSubmit={canSubmit}
          onSubmit={handleCheckout}
          serverError={serverError}
        />
      </div>
    </div>
  );
}
