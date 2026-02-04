#!/bin/bash

# TaxPulse OE - Features 1 & 2 Verification Script

echo "🔍 Checking if Features 1 & 2 are properly deployed..."
echo ""

# Check 1: types.ts has invoiceLink
echo "1️⃣ Checking types.ts for invoiceLink field..."
if grep -q "invoiceLink" src/types.ts; then
    echo "   ✅ types.ts has invoiceLink field"
else
    echo "   ❌ types.ts is missing invoiceLink field"
    echo "   → Copy types_WITH_INVOICE_LINK.ts to src/types.ts"
fi
echo ""

# Check 2: dataService.ts maps invoiceLink
echo "2️⃣ Checking dataService.ts for invoiceLink mapping..."
if grep -q "invoiceLink: item.INVOICE_LINK" src/services/dataService.ts; then
    echo "   ✅ dataService.ts maps invoiceLink"
else
    echo "   ❌ dataService.ts is missing invoiceLink mapping"
    echo "   → Copy dataService_WITH_DELETE_AND_LINKS.ts to src/services/dataService.ts"
fi
echo ""

# Check 3: dataService.ts has deleteTransaction function
echo "3️⃣ Checking dataService.ts for deleteTransaction function..."
if grep -q "export const deleteTransaction" src/services/dataService.ts; then
    echo "   ✅ dataService.ts has deleteTransaction function"
else
    echo "   ❌ dataService.ts is missing deleteTransaction function"
    echo "   → Copy dataService_WITH_DELETE_AND_LINKS.ts to src/services/dataService.ts"
fi
echo ""

# Check 4: DeleteConfirmModal component exists
echo "4️⃣ Checking for DeleteConfirmModal component..."
if [ -f "src/components/DeleteConfirmModal.tsx" ]; then
    echo "   ✅ DeleteConfirmModal.tsx exists"
else
    echo "   ❌ DeleteConfirmModal.tsx is missing"
    echo "   → Copy DeleteConfirmModal.tsx to src/components/"
fi
echo ""

# Check 5: TransactionList imports DeleteConfirmModal
echo "5️⃣ Checking TransactionList for DeleteConfirmModal import..."
if grep -q "import DeleteConfirmModal" src/components/TransactionList.tsx; then
    echo "   ✅ TransactionList imports DeleteConfirmModal"
else
    echo "   ❌ TransactionList doesn't import DeleteConfirmModal"
    echo "   → Copy TransactionList_WITH_DELETE_AND_LINKS.tsx to src/components/TransactionList.tsx"
fi
echo ""

# Check 6: TransactionList has Trash2 and ExternalLink icons
echo "6️⃣ Checking TransactionList for delete and link icons..."
if grep -q "Trash2" src/components/TransactionList.tsx && grep -q "ExternalLink" src/components/TransactionList.tsx; then
    echo "   ✅ TransactionList has delete and link icons"
else
    echo "   ❌ TransactionList is missing icons"
    echo "   → Copy TransactionList_WITH_DELETE_AND_LINKS.tsx to src/components/TransactionList.tsx"
fi
echo ""

# Check 7: TransactionList has onDeleteTransaction prop
echo "7️⃣ Checking TransactionList for onDeleteTransaction prop..."
if grep -q "onDeleteTransaction" src/components/TransactionList.tsx; then
    echo "   ✅ TransactionList has onDeleteTransaction prop"
else
    echo "   ❌ TransactionList is missing onDeleteTransaction prop"
    echo "   → Copy TransactionList_WITH_DELETE_AND_LINKS.tsx to src/components/TransactionList.tsx"
fi
echo ""

# Check 8: App.tsx imports deleteTransaction
echo "8️⃣ Checking App.tsx for deleteTransaction import..."
if grep -q "deleteTransaction" src/App.tsx; then
    echo "   ✅ App.tsx imports deleteTransaction"
else
    echo "   ❌ App.tsx doesn't import deleteTransaction"
    echo "   → Copy App_WITH_DELETE_FEATURE.tsx to src/App.tsx"
fi
echo ""

# Check 9: App.tsx has handleDeleteTransaction function
echo "9️⃣ Checking App.tsx for handleDeleteTransaction..."
if grep -q "handleDeleteTransaction" src/App.tsx; then
    echo "   ✅ App.tsx has handleDeleteTransaction"
else
    echo "   ❌ App.tsx is missing handleDeleteTransaction"
    echo "   → Copy App_WITH_DELETE_FEATURE.tsx to src/App.tsx"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo ""
echo "If all checks are ✅, Features 1 & 2 are deployed correctly."
echo "If any checks are ❌, follow the instructions to fix them."
echo ""
echo "After fixing, restart your dev server:"
echo "  npm run dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
