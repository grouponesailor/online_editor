// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    <T>(id: string): T;
    keys(): string[];
  };
};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().forEach(context);

// Global test utilities
(window as any).mockFetch = (response: any, ok: boolean = true) => {
  return spyOn(window, 'fetch').and.returnValue(
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response))
    } as Response)
  );
};

// Mock clipboard API for tests
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve()),
    readText: jasmine.createSpy('readText').and.returnValue(Promise.resolve(''))
  },
  writable: true
});

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeEach(() => {
  spyOn(console, 'log').and.stub();
  spyOn(console, 'warn').and.stub();
  spyOn(console, 'error').and.stub();
});

afterEach(() => {
  // Restore console if needed for debugging
  // console.log = originalConsole.log;
  // console.warn = originalConsole.warn;
  // console.error = originalConsole.error;
});