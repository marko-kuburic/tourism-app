# 🌀 SAGA Orkestracija (Purchase ↔ Tour)

Ova implementacija demonstrira **SAGA obrazac** između dva mikroservisa:

- **purchase** (orkestrator)
- **tour** (koordinator verifikacije)

---

## 🔑 Koraci u SAGA-i

### Step 1: VERIFY_TOURS
- Purchase servis proverava svaku turu preko `tour` mikroservisa  
- Endpoint: `GET /tours/{id}/public`  
- **Ako padne** ⇒ Checkout se prekida, nema side-effecta

### Step 2: CREATE_TOKENS + MARK_CHECKED_OUT
- U jednoj DB transakciji:
  - kreiraju se tokeni za sve ture
  - korpa se označava kao `CHECKED_OUT`  
- **Ako padne** ⇒ radi se rollback (`tx.Rollback()`), korpa ostaje **OPEN**

---

## ✅ Happy Path

1. Dodaj turu u korpu (UI).
2. Klikni **Checkout**.
3. Logovi (`docker compose logs -f purchase | Select-String "SAGA"`):


[SAGA][...] STEP=VERIFY_TOURS tours=[...]
[SAGA][...] STEP=CREATE_TOKENS begin TX
[SAGA][...] STEP=CREATE_TOKENS ok count=1
[SAGA][...] STEP=MARK_CHECKED_OUT cart=...
[SAGA][...] SUCCESS Checkout tokens=1

## X Fail path
1. docker compose stop purchase-db
