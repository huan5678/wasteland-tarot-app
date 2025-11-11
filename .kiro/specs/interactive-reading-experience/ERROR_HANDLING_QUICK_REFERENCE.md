# Error Handling Quick Reference Guide

**Phase 11 Implementation | Tasks 15.1-15.8**

---

## 📚 Quick Import Guide

```typescript
// Error Handling Hooks
import {
  useApiWithTimeout,
  useOfflineDetection,
  useLocalStorageFallback
} from '@/hooks/errorHandling';

// Input Validation Utilities
import {
  validateSearchInput,
  sanitizeInput,
  validateDateRange,
  validateTag,
  validateCategory
} from '@/utils/inputValidation';

// UI Components
import { OfflineNotice } from '@/components/common/OfflineNotice';
import { BrowserCompatibilityWarning } from '@/components/common/BrowserCompatibilityWarning';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
```

---

## 🔧 Hook Usage Examples

### 1. API Timeout Handling

```typescript
const { fetchWithTimeout, isTimeout, resetTimeout } = useApiWithTimeout(30000);

try {
  const response = await fetchWithTimeout('/api/v1/readings', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
} catch (error) {
  if (isTimeout) {
    // Show user-friendly timeout message
    console.error('請求超時，請重試');
  }
}
```

### 2. Offline Detection

```typescript
const { isOnline, queueRequest, queuedCount } = useOfflineDetection();

const handleSave = async () => {
  if (!isOnline) {
    queueRequest(() => saveToBackend(data));
    console.log('離線中，已加入重試佇列');
    return;
  }

  await saveToBackend(data);
};
```

### 3. LocalStorage Fallback

```typescript
const { saveReadingWithFallback, hasPendingBackup } = useLocalStorageFallback();

const saveReading = async (reading: Reading) => {
  const saveToBackend = async (r: Reading) => {
    const response = await fetch('/api/v1/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r)
    });

    if (!response.ok) throw new Error('Save failed');
  };

  // Automatic fallback to LocalStorage on failure
  await saveReadingWithFallback(reading, saveToBackend);
};

// Check for pending backups
useEffect(() => {
  if (hasPendingBackup) {
    console.log('有待同步的備份資料');
  }
}, [hasPendingBackup]);
```

### 4. Input Validation

```typescript
const [searchInput, setSearchInput] = useState('');
const [validationError, setValidationError] = useState<string | null>(null);

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const rawValue = e.target.value;

  // Validate
  const error = validateSearchInput(rawValue);
  if (error) {
    setValidationError(error);
    return;
  }

  setValidationError(null);

  // Sanitize and update
  const sanitized = sanitizeInput(rawValue);
  setSearchInput(sanitized);
};

// Display error
{validationError && (
  <p className="text-red-400 text-sm">{validationError}</p>
)}
```

---

## 🎨 Component Usage Examples

### 1. Offline Notice (Global)

```tsx
// In layout.tsx or app-level component
export default function RootLayout({ children }) {
  return (
    <>
      <OfflineNotice />
      {children}
    </>
  );
}
```

### 2. Browser Compatibility Warning

```tsx
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

const MyComponent = () => {
  const { browserInfo } = useTextToSpeech();

  return (
    <>
      <BrowserCompatibilityWarning
        feature="語音朗讀"
        isSupported={browserInfo.isSupported}
        recommendedBrowsers={browserInfo.recommendedBrowsers}
        currentBrowser={browserInfo.currentBrowser}
      />
      {/* Rest of component */}
    </>
  );
};
```

### 3. Error Boundary Wrapping

```tsx
// Wrap route or component tree
export default function MyPage() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}

// Custom fallback UI
<ErrorBoundary fallback={<CustomErrorUI />}>
  <MyComponent />
</ErrorBoundary>
```

### 4. Error Recovery UI Pattern

```tsx
const [loadError, setLoadError] = useState<string | null>(null);

const reloadData = async () => {
  try {
    setLoadError(null);
    await fetchData();
  } catch (error: any) {
    setLoadError(error.message || '載入失敗，請重試');
  }
};

return (
  <>
    {loadError && (
      <div className="border-2 border-red-500 bg-red-500/10 p-4">
        <div className="flex items-start gap-3">
          <PixelIcon name="alert-triangle" variant="error" />
          <div className="flex-1">
            <p className="text-red-500 font-bold">載入失敗</p>
            <p className="text-red-400 text-sm">{loadError}</p>
            <button onClick={reloadData}>重新載入</button>
          </div>
        </div>
      </div>
    )}
    {/* Main content */}
  </>
);
```

---

## 📋 Validation Functions Reference

| Function | Purpose | Error Message (zh-TW) |
|----------|---------|----------------------|
| `validateSearchInput(input)` | 1-50 characters, no `<>` | "請輸入有效關鍵字（1-50 字元）"<br>"包含不允許的字元" |
| `validateDateRange(start, end)` | start <= end | "開始日期不能晚於結束日期" |
| `validateTag(tag)` | 1-20 characters, no `/\<>` | "標籤不能為空"<br>"標籤長度不能超過 20 字元" |
| `validateCategory(category)` | 1-30 characters, no `/\<>` | "分類不能為空"<br>"分類名稱不能超過 30 字元" |
| `sanitizeInput(input)` | Remove `<>` and trim | N/A (always succeeds) |

---

## 🚨 Error Logging

Error logs are automatically sent to `/api/v1/logs/errors` when caught by `ErrorBoundary`.

**Log Structure**:
```typescript
{
  timestamp: "2025-11-12T10:30:00.000Z",
  errorType: "TypeError",
  message: "Cannot read property 'x' of undefined",
  stackTrace: "Error: ...\n  at Component ...",
  componentStack: "  in Component (at App.tsx:10)",
  context: {
    url: "https://wasteland-tarot.com/readings",
    userAgent: "Mozilla/5.0 ..."
  }
}
```

---

## 🎯 Common Patterns

### Pattern 1: API Request with Full Error Handling

```typescript
const MyComponent = () => {
  const { fetchWithTimeout, isTimeout } = useApiWithTimeout();
  const { isOnline, queueRequest } = useOfflineDetection();
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = async () => {
    try {
      setError(null);

      // Check online status first
      if (!isOnline) {
        queueRequest(() => handleApiCall());
        setError('目前離線，已加入重試佇列');
        return;
      }

      // Fetch with timeout
      const response = await fetchWithTimeout('/api/v1/data');
      const data = await response.json();

      // Handle success
    } catch (err: any) {
      if (isTimeout) {
        setError('請求超時，請重試');
      } else {
        setError(err.message || '發生錯誤');
      }
    }
  };

  return (
    <>
      {error && <ErrorDisplay message={error} />}
      <button onClick={handleApiCall}>執行請求</button>
    </>
  );
};
```

### Pattern 2: Form with Validation

```typescript
const MyForm = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validate
    const validationError = validateSearchInput(searchQuery);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Sanitize
    const sanitized = sanitizeInput(searchQuery);

    // Submit
    submitSearch(sanitized);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setError(null); // Clear error on change
        }}
      />
      {error && <span className="text-red-400">{error}</span>}
      <button type="submit">搜尋</button>
    </form>
  );
};
```

### Pattern 3: Data Loading with Recovery

```typescript
const MyDataComponent = () => {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoadError(null);
      setIsLoading(true);
      const result = await fetchData();
      setData(result);
    } catch (error: any) {
      setLoadError(error.message || '載入失敗');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) return <LoadingSpinner />;

  if (loadError) return (
    <ErrorRecoveryUI
      error={loadError}
      onRetry={loadData}
    />
  );

  return <DataDisplay data={data} />;
};
```

---

## 🧪 Testing Checklist

- [ ] **Timeout**: Slow 3G simulation in DevTools
- [ ] **Offline**: Network → Offline in DevTools
- [ ] **LocalStorage**: Mock 500 errors
- [ ] **Validation**: Test edge cases (empty, > 50 chars, special chars)
- [ ] **Browser Compat**: Test in Firefox (no Web Speech API)
- [ ] **Error Logging**: Verify POST to `/api/v1/logs/errors`
- [ ] **Error Recovery**: Mock data fetch failures

---

## 📖 Related Files

| Category | File Path |
|----------|-----------|
| **Hooks** | `/src/hooks/useApiWithTimeout.ts` |
| | `/src/hooks/useOfflineDetection.ts` |
| | `/src/hooks/useLocalStorageFallback.ts` |
| | `/src/hooks/errorHandling.ts` (index) |
| **Utilities** | `/src/utils/inputValidation.ts` |
| **Components** | `/src/components/common/OfflineNotice.tsx` |
| | `/src/components/common/BrowserCompatibilityWarning.tsx` |
| | `/src/components/common/ErrorBoundary.tsx` |
| **Examples** | `/src/components/examples/ErrorHandlingExample.tsx` |
| **Integration** | `/src/app/readings/page.tsx` (error recovery) |
| | `/src/components/readings/SearchInput.tsx` (validation) |

---

**Quick Reference Version**: 1.0
**Last Updated**: 2025-11-12
