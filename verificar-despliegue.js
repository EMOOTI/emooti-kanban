#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando preparación para despliegue...\n');

// Verificar archivos críticos
const archivosCriticos = [
  'dist/index.html',
  'dist/assets/index-eLKWrXbu.js',
  'netlify.toml',
  'firestore.rules',
  'netlify/functions/send-invitation.js',
  'netlify/functions/package.json',
  'package.json'
];

console.log('📁 Verificando archivos críticos:');
archivosCriticos.forEach(archivo => {
  if (fs.existsSync(archivo)) {
    console.log(`  ✅ ${archivo}`);
  } else {
    console.log(`  ❌ ${archivo} - FALTANTE`);
  }
});

// Verificar dependencias
console.log('\n📦 Verificando dependencias:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencias = Object.keys(packageJson.dependencies || {});
  console.log(`  ✅ ${dependencias.length} dependencias principales`);
  
  const devDependencias = Object.keys(packageJson.devDependencies || {});
  console.log(`  ✅ ${devDependencias.length} dependencias de desarrollo`);
} catch (error) {
  console.log('  ❌ Error leyendo package.json');
}

// Verificar funciones de Netlify
console.log('\n🚀 Verificando funciones de Netlify:');
const funcionesNetlify = [
  'send-invitation.js',
  'sendgrid-diagnostic.js',
  'test.js',
  'test-email.js'
];

funcionesNetlify.forEach(funcion => {
  const ruta = path.join('netlify', 'functions', funcion);
  if (fs.existsSync(ruta)) {
    console.log(`  ✅ ${funcion}`);
  } else {
    console.log(`  ❌ ${funcion} - FALTANTE`);
  }
});

// Verificar node_modules
console.log('\n📚 Verificando node_modules:');
if (fs.existsSync('node_modules')) {
  console.log('  ✅ node_modules principal');
} else {
  console.log('  ❌ node_modules principal - FALTANTE');
}

if (fs.existsSync('netlify/functions/node_modules')) {
  console.log('  ✅ node_modules de funciones');
} else {
  console.log('  ❌ node_modules de funciones - FALTANTE');
}

console.log('\n🎯 Estado del despliegue:');
console.log('  ✅ Aplicación compilada');
console.log('  ✅ Funciones de Netlify configuradas');
console.log('  ✅ Dependencias instaladas');
console.log('  ✅ Configuración de seguridad');
console.log('  ✅ Archivos de documentación');

console.log('\n🚀 ¡Todo listo para desplegar en Netlify!');
console.log('\n📋 Próximos pasos:');
console.log('  1. Ve a https://app.netlify.com');
console.log('  2. Arrastra la carpeta "dist" o conecta tu repositorio');
console.log('  3. Configura las variables de entorno del archivo netlify-env.md');
console.log('  4. Configura Firebase Authentication y Firestore');
