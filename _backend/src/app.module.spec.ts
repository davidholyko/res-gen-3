import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { AppController } from './app.controller';
import { AppModule } from './app.module';

describe('AppModule', () => {
  it('wires AppController through the module', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(AppController)).toBeInstanceOf(AppController);
  });
});
