import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Función de prueba funcionando correctamente",
      timestamp: new Date().toISOString()
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  )
}) 