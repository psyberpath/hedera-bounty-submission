# Verifiable Data Analytics Pipeline with Hedera (HCS)

**Bounty:** https://quest.hederahacks.com/quests/76
**Video Demo:** https://drive.google.com/drive/folders/1um0rh5umeoh5RanZbCpBOZS5sI40o9xp?usp=drive_link

## 🚀 The Problem

Traditional analytics on SQL databases are vulnerable. Data can be tampered with by administrators or attackers, and compliance reports cannot be fully trusted. There is no way to *prove* that data hasn't been altered *after* it was written, making true data integrity impossible.

## ✅ The Solution

This project is a **NestJS "bridge" service** that integrates with legacy SQL systems to create an **immutable, verifiable audit trail** on the **Hedera Consensus Service (HCS)**.

Every time a new piece of data is written to the local SQL database, this service:
1.  Generates a unique SHA-256 fingerprint (hash) of the data payload and its timestamp.
2.  Submits this hash to a private HCS topic, creating an immutable, timestamped "proof of existence."
3.  Saves the data *and* the resulting `hederaTransactionId` (the proof) to the local SQL database.

A `/verify` endpoint allows anyone (like an auditor) to check a log's integrity at any time. It re-calculates the local hash and compares it to the hash stored on the Hedera ledger, which is retrieved via a Hedera Mirror Node.

* If the hashes match, `isVerified: true` ✅
* If the local data has been tampered with, `isVerified: false` ❌

## 🏆 How it Meets Bounty Requirements

This solution directly addresses all three quest requirements:

* **Req 1 (DLT Components):** Uses the **Hedera Consensus Service (HCS)** as a high-throughput, low-cost "trust layer" for logging. This is a perfect real-world use case for HCS.
* **Req 2 (Legacy Integration):** Directly integrates with a **`sqlite` (SQL) database** (representing a legacy system) and ingests data via a standard **REST API** (the NestJS app).
* **Req 3 (Real-World Application):** Demonstrates **automated compliance reporting** and **verifiable data analytics**. An auditor can now use the `/verify` endpoint to *programmatically prove* data integrity, redefining data-driven decision-making.

## 🛠️ How to Run

1.  Clone the repository:
    ```bash
    git clone https://github.com/psyberpath/hedera-bounty-submission.git
    cd hedera-bounty-submission
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root and add your Hedera Testnet credentials:
    ```.env
    MY_ACCOUNT_ID=0.0.xxxxxx
    MY_PRIVATE_KEY=302e02010030...
    TOPIC_ID=0.0.xxxxxx
    ```
4.  Run the application:
    ```bash
    npm run start:dev
    ```
    The server will be running on `http://localhost:3000`.

## 📡 API Endpoints

### 1. Create a Verifiable Log

Submits a new log to the database and notarizes its hash on HCS.

**POST** `http://localhost:3000/logs`

**Body:**
```json
{
  "userId": "user-9876",
  "eventType": "KYC_COMPLETED",
  "data": {
    "level": "tier-2",
    "country": "NG"
  }
}
````

**Success Response:**

```json
{
    "id": "b015d05c-1d9c-44f6-804f-d4a413577f25",
    "userId": "user-9876",
    "eventType": "KYC_COMPLETED",
    "data": { ... },
    "createdAt": "2025-10-30T04:47:30.177Z",
    "hederaTransactionId": "0.0.7105307@1761799643.184147274"
}
```

### 2\. Verify a Log's Integrity

Checks the local database hash against the immutable hash on the Hedera ledger.

**GET** `http://localhost:3000/logs/verify/:id`

**Success Response (Untampered):**

```json
{
    "isVerified": true,
    "logId": "b015d05c-1d9c-44f6-804f-d4a413577f25",
    "databaseHash": "c367c4f...428e",
    "hederaHash": "c367c4f...428e",
    "logDetails": { ... }
}
```

**Success Response (Tampered):**

```json
{
    "isVerified": false,
    "logId": "b015d05c-1d9c-44f6-804f-d4a413577f25",
    "databaseHash": "a123b45...888f",
    "hederaHash": "c367c4f...428e",
    "logDetails": { ... }
}
```
