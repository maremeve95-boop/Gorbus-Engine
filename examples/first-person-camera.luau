-- GE 1.0.4 — First-person character controller
-- Objeto requerido: Player con Rigidbody y Capsule Collider.
-- El suelo debe tener un Collider estático.

local playerName = "Player"
local lookSensitivity = 0.0022
local moveSpeed = 6
local jumpImpulse = 4.2

local yaw = 0
local pitch = 0

function onStart()
    Gorbus.setCameraMode("game")
    -- Chrome puede pedir un clic adicional en «Capturar ratón».
    Gorbus.lockMouse(true)
    Gorbus.log("FPS activo: WASD para moverte, ratón para mirar y Espacio para saltar.")
end

function onUpdate(dt: number)
    local mouse = Gorbus.getMouseDelta()
    yaw -= mouse.x * lookSensitivity
    pitch = math.clamp(pitch - mouse.y * lookSensitivity, -1.45, 1.45)

    local player = Gorbus.getObjectPosition(playerName)
    if not player then return end

    -- La cámara sigue la cápsula. ControlCharacter usa su orientación real
    -- para calcular el movimiento, evitando invertir W/S o A/D.
    Gorbus.setCameraPosition(player.x, player.y + 1.45, player.z)
    Gorbus.setCameraRotation(pitch, yaw, 0)
    Gorbus.controlCharacter(moveSpeed, jumpImpulse, playerName)
end

function onStop()
    Gorbus.lockMouse(false)
    Gorbus.log("Controlador en primera persona detenido.")
end
