# Pruebas reales autorizadas del setter

Esta carpeta corresponde a la solicitud explícita del 2026-10-23 de ejecutar dos pruebas de diez pasos con Luna low y high. Esa solicitud habilita estas pruebas reales puntuales sobre la regla general de pruebas unitarias de AGENTS.md. No son mocks ni forman parte de `npm test`.

Los scripts independientes de `scripts` usan el mismo guion y dos Previews aislados del pipeline HTTP real de la aplicación: sesión/cookie → API → autorización de cuotas y presupuesto en Supabase → OpenAI → validación → respuesta aprobada → cierre tras diez rondas. No cambian las variables del chat público. No automatizan el DOM del navegador: su alcance es E2E HTTP del pipeline conversacional, que se declara en los informes.

Modelo: `gpt-6-luna`; esfuerzos `low` y `high`, según https://developers.openai.com/api/docs/models/gpt-6-luna. Las tarifas y la cotización se conservan junto a los resultados. Solo se atribuyen tokens medidos por el proveedor; los costos se calculan con tarifas publicadas y se distinguen de una factura final o de las reservas conservadoras de presupuesto.

Los scripts no llevan secretos incrustados. La protección de los Previews se atraviesa con la CLI autenticada de Vercel. Las cookies locales de las pruebas se guardan en `.preview` y no se incluyen en informes ni en despliegues. La carpeta completa queda excluida del paquete de Vercel.

## Ejecución independiente

Desde la raíz del proyecto, con la CLI de Vercel autenticada y las variables del servidor ya configuradas en Preview:

```powershell
.\.venv\Scripts\python.exe "chatbot testing/scripts/test_1_luna_low.py"
.\.venv\Scripts\python.exe "chatbot testing/scripts/test_2_luna_high.py"
```

Cada comando crea su propio Preview y ejecuta exactamente el caso solicitado. `--deployment URL` permite usar un Preview aislado existente; el script verifica que declara el modelo y esfuerzo esperados antes de consumir una ronda. **Volver a ejecutar un script crea otra prueba facturable**; generar de nuevo los informes desde la evidencia no hace llamadas.

Se mantiene un límite de 25.000 tokens de salida por intento para los dos casos, incluido razonamiento, en lugar de los 256 del chat original. La comparación usa únicamente estos Previews y no cambia el modelo ni el esfuerzo global del proyecto. Las reservas máximas quedan dentro del presupuesto autorizado de US$3/día.

La carpeta `evidence` conserva el acceso confirmado al modelo, fuentes de precios/tipo de cambio, configuración de cada despliegue, veinte registros de uso y comprobaciones adicionales. Los dos contactos ficticios creados permanecen identificados como `Chatbot Testing Test 1/2`; no se envían mensajes ni se inicia contacto automático.
