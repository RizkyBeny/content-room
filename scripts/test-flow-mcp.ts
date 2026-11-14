import { FlowMcpClient } from '../lib/flowMcp/client';

async function main() {
  console.log('=== Flow MCP Diagnostic & Health Check ===\n');

  const client = new FlowMcpClient();
  const health = await client.checkHealth();

  if (!health.ok) {
    console.error('❌ Flow MCP Server offline:');
    console.error(health.error);
    console.log('\nPetunjuk untuk menyalakan:');
    console.log('1. Buka terminal baru');
    console.log('2. Jalankan: pnpm flow:studio  (atau: cd ~/flow-mcp && npm run studio)');
    console.log('3. Pastikan port 8787 aktif dan Chrome Flow terbuka');
    process.exit(1);
  }

  console.log('✅ Flow MCP Server aktif di 127.0.0.1:8787!');
  console.log('Info server:', health.info);

  try {
    const status = await client.getStatus();
    console.log('\n✅ Status Sesi Google Flow:', JSON.stringify(status, null, 2));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('⚠️ Tidak dapat membaca status akun Google Flow (pastikan sudah login di Chrome):', msg);
  }

  console.log('\n=== Diagnostik Selesai ===');
}

main().catch(console.error);

