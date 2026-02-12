/**
 * Environment Validation Utility
 * Validates required environment variables at startup
 */

interface ValidationRule {
  key: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean';
  defaultValue?: string;
  description: string;
}

const validationRules: ValidationRule[] = [
  {
    key: 'REACT_APP_API_URL',
    required: true,
    type: 'string',
    description: 'Base URL for the API server',
  },
  {
    key: 'REACT_APP_API_VERSION',
    required: false,
    type: 'string',
    defaultValue: 'v1',
    description: 'API version to use',
  },
  {
    key: 'REACT_APP_ENABLE_DEBUG',
    required: false,
    type: 'boolean',
    defaultValue: 'false',
    description: 'Enable debug mode',
  },
  {
    key: 'REACT_APP_ENABLE_MOCK_API',
    required: false,
    type: 'boolean',
    defaultValue: 'false',
    description: 'Use mock API instead of real API',
  },
];

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const rule of validationRules) {
    const value = process.env[rule.key];
    
    // Check required variables
    if (rule.required && !value) {
      errors.push(`Missing required environment variable: ${rule.key} - ${rule.description}`);
      continue;
    }
    
    // Type validation
    if (value) {
      switch (rule.type) {
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`${rule.key} must be a number, got: ${value}`);
          }
          break;
        case 'boolean':
          if (!['true', 'false'].includes(value.toLowerCase())) {
            warnings.push(`${rule.key} should be 'true' or 'false', got: ${value}`);
          }
          break;
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${rule.key} must be a string`);
          }
          break;
      }
    }
    
    // Check for default values
    if (!value && rule.defaultValue) {
      warnings.push(`Using default value for ${rule.key}: ${rule.defaultValue}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function logEnvironmentStatus(): void {
  const result = validateEnvironment();
  
  if (result.isValid) {
    console.log('✅ Environment validation passed');
  } else {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}

// Auto-validate in development
if (process.env.NODE_ENV === 'development') {
  logEnvironmentStatus();
}
