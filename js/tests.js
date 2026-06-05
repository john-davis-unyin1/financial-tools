/**
 * Unit Tests for Calculator Engine - PRODUCTION READY
 */

window.__testLogs = [];

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  assertEquals(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
    }
  }

  assertClose(actual, expected, tolerance = 0.01, message) {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(`${message}\nExpected: ~${expected}\nActual: ${actual}`);
    }
  }

  assertTrue(value, message) {
    if (value !== true) {
      throw new Error(message);
    }
  }

  assertFalse(value, message) {
    if (value !== false) {
      throw new Error(message);
    }
  }

  async run() {
    console.log(`\n🧪 Running ${this.tests.length} tests...\n`);
    
    for (const test of this.tests) {
      try {
        await test.fn(this);
        this.passed++;
        const logMsg = `✅ ${test.name}`;
        console.log(logMsg);
        window.__testLogs.push(logMsg);
      } catch (error) {
        this.failed++;
        const logMsg = `❌ ${test.name}`;
        console.error(logMsg);
        console.error(`   ${error.message}\n`);
        window.__testLogs.push(logMsg);
        window.__testLogs.push(`   ${error.message}`);
      }
    }

    console.log(`\n📊 Results: ${this.passed}/${this.tests.length} passed`);
    if (this.failed > 0) {
      console.log(`⚠️  ${this.failed} failed\n`);
    } else {
      console.log(`🎉 All tests passed!\n`);
    }
    
    return this.failed === 0;
  }
}

const runner = new TestRunner();

// ============================================
// CALCULATOR ENGINE TESTS
// ============================================

runner.test('CalculatorEngine: Evaluate simple formula', (assert) => {
  const result = CalculatorEngine.evaluate('f1 + f2', { f1: 100, f2: 50 });
  assert.assertEquals(result, 150, 'Simple addition');
});

runner.test('CalculatorEngine: Evaluate percentage', (assert) => {
  const result = CalculatorEngine.evaluate('f1 * (f2/100)', { f1: 5000, f2: 25 });
  assert.assertClose(result, 1250, 0.01, 'Percentage calculation');
});

runner.test('CalculatorEngine: Evaluate complex formula', (assert) => {
  const result = CalculatorEngine.evaluate('(f1 * 0.153) - ((f1 * 0.153) * 0.85)', { f1: 85000 });
  assert.assertClose(result, 1934.55, 1, 'Complex tax calculation');
});

runner.test('CalculatorEngine: Reject invalid formula', (assert) => {
  try {
    CalculatorEngine.evaluate('f1 + malicious()', { f1: 100 });
    throw new Error('Should have thrown');
  } catch (error) {
    assert.assertTrue(error.message.includes('Invalid'), 'Rejected malicious code');
  }
});

runner.test('CalculatorEngine: Handle large numbers', (assert) => {
  const result = CalculatorEngine.evaluate('f1 * f2', { f1: 1000000, f2: 1000 });
  assert.assertTrue(Number.isFinite(result), 'Large numbers handled');
});

// ============================================
// VALIDATION TESTS
// ============================================

runner.test('Validation: Reject empty field', (assert) => {
  const field = { label: 'Amount', type: 'currency', min: 0 };
  const result = CalculatorEngine.validateField('', field);
  assert.assertFalse(result.valid, 'Empty field rejected');
});

runner.test('Validation: Reject non-numeric', (assert) => {
  const field = { label: 'Amount', type: 'currency', min: 0 };
  const result = CalculatorEngine.validateField('abc', field);
  assert.assertFalse(result.valid, 'Non-numeric rejected');
});

runner.test('Validation: Enforce minimum', (assert) => {
  const field = { label: 'Rate', type: 'percentage', min: 0, max: 100 };
  const result = CalculatorEngine.validateField('-5', field);
  assert.assertFalse(result.valid, 'Below minimum rejected');
});

runner.test('Validation: Enforce maximum', (assert) => {
  const field = { label: 'Rate', type: 'percentage', min: 0, max: 100 };
  const result = CalculatorEngine.validateField('150', field);
  assert.assertFalse(result.valid, 'Above maximum rejected');
});

runner.test('Validation: Accept valid input', (assert) => {
  const field = { label: 'Amount', type: 'currency', min: 0 };
  const result = CalculatorEngine.validateField('5000', field);
  assert.assertTrue(result.valid, 'Valid input accepted');
});

runner.test('Validation: Accept zero', (assert) => {
  const field = { label: 'Amount', type: 'currency', min: 0 };
  const result = CalculatorEngine.validateField('0', field);
  assert.assertTrue(result.valid, 'Zero accepted');
});

// ============================================
// FORMATTER TESTS
// ============================================

runner.test('Formatter: Format currency', (assert) => {
  const formatted = Formatter.currency(1234.56);
  assert.assertTrue(formatted.includes('1234') && formatted.includes('56'), 'Currency formatted');
});

runner.test('Formatter: Format percentage', (assert) => {
  const formatted = Formatter.percentage(25.5);
  assert.assertEquals(formatted, '25.50%', 'Percentage formatted');
});

runner.test('Formatter: Format negative', (assert) => {
  const formatted = Formatter.currency(-500);
  assert.assertTrue(formatted.includes('500'), 'Negative handled');
});

runner.test('Formatter: Generic dispatcher', (assert) => {
  const curr = Formatter.format(1000, 'currency');
  const perc = Formatter.format(50, 'percentage');
  assert.assertTrue(curr.includes('1000'), 'Currency dispatch');
  assert.assertEquals(perc, '50.00%', 'Percentage dispatch');
});

// ============================================
// STORAGE TESTS
// ============================================

runner.test('Storage: Check availability', (assert) => {
  const available = StorageManager.isAvailable();
  assert.assertTrue(typeof available === 'boolean', 'Storage check returns boolean');
});

runner.test('Storage: Toggle favorite', (assert) => {
  const id = 'test-' + Date.now();
  StorageManager.toggleFavorite(id);
  const favorites = StorageManager.getFavorites();
  assert.assertTrue(Array.isArray(favorites), 'Favorites is array');
  StorageManager.toggleFavorite(id); // Cleanup
});

runner.test('Storage: Get empty favorites', (assert) => {
  StorageManager.FAVORITES_KEY = 'test_fav_' + Date.now();
  const favorites = StorageManager.getFavorites();
  assert.assertTrue(Array.isArray(favorites), 'Returns array even if empty');
});

// ============================================
// INTEGRATION TESTS
// ============================================

runner.test('Integration: Full calculator flow', (assert) => {
  const calculator = {
    id: 'test',
    fields: [
      { id: 'f1', label: 'Amount', type: 'currency', min: 0 },
      { id: 'f2', label: 'Rate', type: 'percentage', min: 0, max: 100 }
    ],
    results: [
      { label: 'Tax', formula: 'f1 * (f2/100)', format: 'currency', highlight: true },
      { label: 'Net', formula: 'f1 - (f1 * (f2/100))', format: 'currency' }
    ]
  };

  const inputs = { f1: '5000', f2: '25' };
  const results = CalculatorEngine.calculate(calculator, inputs);
  
  assert.assertEquals(results.length, 2, 'All results calculated');
  assert.assertClose(results[0].value, 1250, 0.01, 'Tax calculated');
  assert.assertClose(results[1].value, 3750, 0.01, 'Net calculated');
});

runner.test('Integration: Reject invalid input', (assert) => {
  const calculator = {
    fields: [
      { id: 'f1', label: 'Amount', type: 'currency', min: 0 }
    ],
    results: [
      { label: 'Tax', formula: 'f1 * 0.25', format: 'currency' }
    ]
  };

  try {
    CalculatorEngine.calculate(calculator, { f1: 'invalid' });
    throw new Error('Should have thrown');
  } catch (error) {
    assert.assertTrue(error.message.includes('Amount'), 'Invalid rejected');
  }
});

runner.test('Integration: Sequential calculations', (assert) => {
  const c1 = CalculatorEngine.evaluate('100 + 50', {});
  const c2 = CalculatorEngine.evaluate('150 * 2', {});
  const c3 = CalculatorEngine.evaluate('300 / 10', {});
  
  assert.assertEquals(c1, 150, 'First calc');
  assert.assertEquals(c2, 300, 'Second calc');
  assert.assertEquals(c3, 30, 'Third calc');
});

// ============================================
// RUN TESTS
// ============================================

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    runner.run();
  });
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runner };
  runner.run().catch(console.error);
}
