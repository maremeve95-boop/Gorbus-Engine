-- GE 1.0.3 — First-person camera controller
-- Añade un Rigidbody y Collider al objeto "Player".
-- Para usar la cámara como transform editable, añade también el componente "Camera"
-- a un objeto vacío y colócalo donde quieras iniciar la vista.

local playerName = "Player"
local lookSensitivity = 0.0022
local moveSpeed = 6
local jumpImpulse = 4.2

local yaw = 0
local pitch = 0

function onStart()
    Gorbus.setCameraMode("game")
    -- El navegador puede pedir un clic adicional para aceptar Pointer Lock.
    Gorbus.lockMouse(true)
    Gorbus.log("Cámara de juego activa. Ratón para mirar · WASD para moverte.")
end

function onUpdate(dt: number)
    local mouse = Gorbus.getMouseDelta()
    yaw -= mouse.x * lookSensitivity
    pitch = math.clamp(pitch - mouse.y * lookSensitivity, -1.45, 1.45)

    local player = Gorbus.getObjectPosition(playerName)
    if not player then return end

    -- X = pitch, Y = yaw, Z = roll; los ángulos se expresan en radianes.
    Gorbus.setCameraPosition(player.x, player.y + 1.55, player.z)
    Gorbus.setCameraRotation(pitch, yaw, 0)

    -- Vectores de movimiento relativos a la dirección de la cámara.
    local forwardX = math.sin(yaw)
    local forwardZ = -math.cos(yaw)
    local rightX = math.cos(yaw)
    local rightZ = math.sin(yaw)

    local forward = 0
    local strafe = 0
    if Gorbus.isKeyDown("w") then forward += 1 end
    if Gorbus.isKeyDown("s") then forward -= 1 end
    if Gorbus.isKeyDown("d") then strafe += 1 end
    if Gorbus.isKeyDown("a") then strafe -= 1 end

    local moveX = forwardX * forward + rightX * strafe
    local moveZ = forwardZ * forward + rightZ * strafe
    local length = math.sqrt(moveX * moveX + moveZ * moveZ)
    if length > 0 then
        moveX /= length
        moveZ /= length
    end

    if Gorbus.hasRigidbody(playerName) then
        Gorbus.setHorizontalVelocity(playerName, moveX * moveSpeed, moveZ * moveSpeed)
        if Gorbus.isKeyJustPressed("space") then
            Gorbus.applyImpulse(playerName, 0, jumpImpulse, 0)
        end
    elseif length > 0 then
        Gorbus.move(playerName, moveX * moveSpeed * dt, 0, moveZ * moveSpeed * dt)
    end
end

function onStop()
    Gorbus.lockMouse(false)
    Gorbus.log("Cámara de juego detenida.")
end
