#!/usr/bin/env python3
"""فحص حالة UMI PAY v2.1: الجداول، المستخدمون، الإعدادات، القروض"""
import sqlite3, json

DB = "/home/z/my-project/db/custom.db"
con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
cur = con.cursor()

def rows(q):
    try:
        return [dict(r) for r in cur.execute(q).fetchall()]
    except Exception as e:
        return [{"error": str(e)}]

print("=== TABLES ===")
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()]
print(json.dumps(tables, ensure_ascii=False))

print("\n=== User columns ===")
print(json.dumps([r[1] for r in cur.execute('PRAGMA table_info("User")').fetchall()], ensure_ascii=False))

print("\n=== Wallet columns ===")
print(json.dumps([r[1] for r in cur.execute('PRAGMA table_info("Wallet")').fetchall()], ensure_ascii=False))

print("\n=== USERS ===")
for u in rows('SELECT id, phone, name, role, pass, pin FROM "User" ORDER BY role, id'):
    print(json.dumps(u, ensure_ascii=False))

print("\n=== WALLETS ===")
for w in rows('SELECT * FROM "Wallet" ORDER BY id'):
    print(json.dumps(w, ensure_ascii=False))

print("\n=== CurrencySettings ===")
print(json.dumps(rows('SELECT * FROM "CurrencySettings"'), ensure_ascii=False))

print("\n=== LoanRequest ===")
lr = rows('SELECT * FROM "LoanRequest"')
if "error" in lr[0] if lr else False:
    print(lr)
else:
    for l in lr:
        print(json.dumps(l, ensure_ascii=False))

print("\n=== TamayuzCard ===")
print(json.dumps(rows('SELECT * FROM "TamayuzCard"'), ensure_ascii=False))

print("\n=== Transaction count ===")
print(json.dumps(rows('SELECT COUNT(*) as n FROM "Transaction"'), ensure_ascii=False))

con.close()
