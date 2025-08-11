/**
 * Script de prueba para verificar el TimezoneService
 * Usar en la consola del navegador para probar las conversiones de timezone
 */

// Función para probar el timezone service desde la consola
(window as any).testTimezone = function() {
  console.log('🧪 === PRUEBAS DE TIMEZONE SERVICE ===');
  
  // Simular datos similares a los que vimos en el error
  const testDate = new Date('2025-12-12T09:00:00'); // Hora local
  const timezone = 'America/La_Paz';
  const countryCode = 'BO';
  
  console.log('📅 Fecha de prueba:', testDate);
  console.log('🌍 Timezone:', timezone);
  console.log('🏳️ País:', countryCode);
  
  // Simular lo que hace el TimezoneService
  console.log('\n🔍 Simulando búsqueda de timezone info...');
  
  const COUNTRY_TIMEZONES = {
    'BO': [{ timezone: 'America/La_Paz', display_name: 'Bolivia Time', utc_offset: 'UTC-4', dst_aware: false }]
  };
  
  const tzInfo = COUNTRY_TIMEZONES[countryCode]?.find(t => t.timezone === timezone);
  
  if (tzInfo) {
    console.log('✅ Timezone info encontrado:', tzInfo);
    
    // Simular conversión manual
    const offsetMinutes = -4 * 60; // Bolivia UTC-4
    const utcDate = new Date(testDate.getTime() - offsetMinutes * 60000);
    
    console.log('🕐 Hora local:', testDate.toISOString());
    console.log('🌍 Hora UTC:', utcDate.toISOString());
    console.log('📊 Diferencia de offset:', offsetMinutes + ' minutos');
  } else {
    console.error('❌ No se encontró timezone info para', timezone, countryCode);
  }
  
  console.log('\n🔧 === VERIFICACIÓN DEL PROBLEMA ===');
  console.log('El problema reportado:');
  console.log('- Timezone: "America/La_Paz US" (malformado)');
  console.log('- Debería ser: "America/La_Paz"');
  console.log('- País: BO (Bolivia)');
  
  // Probar con el timezone malformado
  const badTimezone = 'America/La_Paz US';
  console.log('\n❌ Probando timezone malformado:', badTimezone);
  
  const cleanedTimezone = badTimezone.includes(' ') ? badTimezone.split(' ')[0] : badTimezone;
  console.log('🔧 Timezone limpiado:', cleanedTimezone);
  
  const cleanedTzInfo = COUNTRY_TIMEZONES[countryCode]?.find(t => t.timezone === cleanedTimezone);
  if (cleanedTzInfo) {
    console.log('✅ Después de limpiar, se encontró:', cleanedTzInfo);
  }
  
  console.log('\n🎯 === RECOMENDACIÓN ===');
  console.log('El fix implementado debería:');
  console.log('1. Limpiar timezone de espacios y códigos extra');
  console.log('2. Proveer fallback si no encuentra el timezone');
  console.log('3. Nunca permitir que class_datetime_utc sea undefined');
};

// Instrucciones para usar en consola
console.log('🧪 Para probar el timezone service, ejecuta: testTimezone()');
