--!strict
-- STRYDE / Gorbus Engine — Port 0.1
-- Primer corte jugable: Campo Orión (Entrenamiento).
-- Requiere GE 2.1 con la API de botones del ratón.

local PLAYER = "Stryde_Player"
local ROUND_SECONDS = 60
local MOUSE_SENSITIVITY = 0.0022

local scanModes = {
    { name = "ORBITAL", points = 25, interval = 0.11 },
    { name = "LUMEN", points = 40, interval = 0.22 },
    { name = "ECHO", points = 55, interval = 0.48 },
    { name = "PRISM", points = 75, interval = 0.85 },
}

local beacons = {
    { name = "Stryde_Beacon_01", x = -9, y = 1.35, z = -7, moving = true, range = 2.2, speed = 1.1, phase = 0.0, respawn = 0, moveClock = 0 },
    { name = "Stryde_Beacon_02", x = -5, y = 1.35, z = -10, moving = false, range = 0, speed = 0, phase = 0.8, respawn = 0, moveClock = 0 },
    { name = "Stryde_Beacon_03", x = 0, y = 1.35, z = -8, moving = true, range = 2.8, speed = 1.5, phase = 1.6, respawn = 0, moveClock = 0 },
    { name = "Stryde_Beacon_04", x = 5, y = 1.35, z = -10, moving = false, range = 0, speed = 0, phase = 2.4, respawn = 0, moveClock = 0 },
    { name = "Stryde_Beacon_05", x = 9, y = 1.35, z = -7, moving = true, range = 2.0, speed = 1.25, phase = 3.2, respawn = 0, moveClock = 0 },
    { name = "Stryde_Beacon_06", x = 0, y = 1.35, z = -13, moving = false, range = 0, speed = 0, phase = 4.0, respawn = 0, moveClock = 0 },
}

local yaw = 0
local pitch = 0
local elapsed = 0
local remaining = ROUND_SECONDS
local score = 0
local scans = 0
local successfulScans = 0
local activatedNodes = 0
local scanModeIndex = 1
local scanCooldown = 0
local beaconUpdateClock = 0
local active = true
local finished = false
local lastTimeNotice = 60
local playerMissingNotice = false

local function clamp(value: number, low: number, high: number): number
    return math.max(low, math.min(high, value))
end

local function directionFromAngles(): (number, number, number)
    local cosPitch = math.cos(pitch)
    return -math.sin(yaw) * cosPitch, math.sin(pitch), -math.cos(yaw) * cosPitch
end

local function beaconByName(name: string)
    for _, beacon in ipairs(beacons) do
        if beacon.name == name then
            return beacon
        end
    end
    return nil
end

local function resetBeacon(beacon)
    beacon.respawn = 0
    beacon.moveClock = 0
    Gorbus.setPosition(beacon.name, beacon.x, beacon.y, beacon.z)
    Gorbus.setColor(beacon.name, "#a8dcff")
end

local function accuracyPercent(): number
    if scans <= 0 then return 0 end
    return math.floor((successfulScans / scans) * 100 + 0.5)
end

local function updateHUD(rank: string?)
    Gorbus.setGameHUD(remaining, score, accuracyPercent(), scanModes[scanModeIndex].name, activatedNodes, rank or "--")
end

local function resetRound()
    elapsed = 0
    remaining = ROUND_SECONDS
    score = 0
    scans = 0
    successfulScans = 0
    activatedNodes = 0
    scanModeIndex = 1
    scanCooldown = 0
    beaconUpdateClock = 0
    active = true
    finished = false
    lastTimeNotice = ROUND_SECONDS
    yaw = 0
    pitch = 0
    updateHUD("--")
    Gorbus.showGameMessage("CAMPO ORIÓN · NUEVA RONDA")

    for _, beacon in ipairs(beacons) do
        resetBeacon(beacon)
    end

    local player = Gorbus.getObjectPosition(PLAYER)
    if player then
        Gorbus.setPosition(PLAYER, 0, 0.95, 9)
        Gorbus.setVelocity(PLAYER, 0, 0, 0)
    end

    Gorbus.log("STRYDE · NUEVA RONDA | 60 segundos | escaneos ilimitados")
end

local function finishRound()
    if finished then
        return
    end
    finished = true
    active = false
    Gorbus.lockMouse(false)

    local accuracy = accuracyPercent()

    local rank = "C"
    if score >= 900 and accuracy >= 70 then
        rank = "S"
    elseif score >= 550 and accuracy >= 50 then
        rank = "A"
    elseif score >= 250 then
        rank = "B"
    end
    updateHUD(rank)
    Gorbus.showGameMessage("FIN DE RONDA · RANGO " .. rank .. " · PULSA T")

    Gorbus.log("════════ STRYDE · RESULTADOS ════════")
    Gorbus.log("PUNTUACIÓN: " .. tostring(score) .. " | RANGO: " .. rank)
    Gorbus.log("ESCANEOS CORRECTOS: " .. tostring(successfulScans) .. " / " .. tostring(scans) .. " | PRECISIÓN: " .. tostring(accuracy) .. "%")
    Gorbus.log("BALIZAS: " .. tostring(activatedNodes) .. " activadas")
    Gorbus.log("Pulsa T para repetir el entrenamiento.")
end

local function updateBeacons(dt: number)
    beaconUpdateClock += dt
    for _, beacon in ipairs(beacons) do
        if beacon.respawn > 0 then
            beacon.respawn = math.max(0, beacon.respawn - dt)
            if beacon.respawn == 0 then
                resetBeacon(beacon)
            end
        elseif beacon.moving and beaconUpdateClock >= 0.06 then
            local offset = math.sin(elapsed * beacon.speed + beacon.phase) * beacon.range
            Gorbus.setPosition(beacon.name, beacon.x + offset, beacon.y, beacon.z)
        end
    end
    if beaconUpdateClock >= 0.06 then
        beaconUpdateClock = 0
    end
end

local function sendScanPulse()
    local scanMode = scanModes[scanModeIndex]
    local player = Gorbus.getObjectPosition(PLAYER)
    if not player then
        return
    end

    local dx, dy, dz = directionFromAngles()
    -- Desplaza el origen ligeramente hacia delante para que el raycast no
    -- comience dentro de la cápsula del propio jugador.
    local originX = player.x + dx * 0.95
    local originY = player.y + 0.62 + dy * 0.95
    local originZ = player.z + dz * 0.95
    local result = Gorbus.raycast(originX, originY, originZ, dx, dy, dz, 85)

    scans += 1
    scanCooldown = scanMode.interval

    if not result then
        return
    end

    local beacon = beaconByName(result.name)
    if not beacon or beacon.respawn > 0 then
        return
    end

    successfulScans += 1
    score += 25

    activatedNodes += 1
    score += scanMode.points
    beacon.respawn = 1.7
    Gorbus.setPosition(beacon.name, beacon.x, -35, beacon.z)
    Gorbus.setColor(beacon.name, "#4a5664")
    Gorbus.showGameMessage("BALIZA ACTIVADA · +" .. tostring(scanMode.points))
    Gorbus.log("BALIZA ACTIVADA · " .. result.name .. " · TOTAL " .. tostring(score))
end

function onStart()
    if not Gorbus.find(PLAYER) then
        Gorbus.log("ERROR STRYDE: falta el objeto Stryde_Player con Rigidbody y Capsule Collider.")
        active = false
        return
    end

    for _, beacon in ipairs(beacons) do
        if not Gorbus.find(beacon.name) then
            Gorbus.log("ERROR STRYDE: falta el objetivo " .. beacon.name)
            active = false
            return
        end
    end

    -- La física ya fue construida antes de onStart; ocultamos solo el modelo visual
    -- para evitar que la cápsula del jugador tape la cámara en primera persona.
    Gorbus.setObjectVisible(PLAYER, false)
    Gorbus.setGameHUD(ROUND_SECONDS, score, 0, scanModes[scanModeIndex].name, activatedNodes, "--")
    Gorbus.showGameMessage("CAMPO ORIÓN · ENTRENAMIENTO")
    Gorbus.setCameraMode("game", 0.1)
    Gorbus.lockMouse(true)
    local player = Gorbus.getObjectPosition(PLAYER)
    if player then
        Gorbus.setCameraPosition(player.x, player.y + 0.62, player.z)
    end
    Gorbus.setCameraRotation(pitch, yaw, 0)

    Gorbus.log("STRYDE · CAMPO ORIÓN · PORT 0.1")
    Gorbus.log("WASD mover · Shift correr · Espacio saltar · Ratón mirar")
    Gorbus.log("Clic izq. escanear · Clic der. estabilizar · 1–4 modos de escaneo · T reiniciar")
    Gorbus.log("ENTRENAMIENTO: 60 s, seis balizas y tres móviles; escaneos ilimitados.")
end

function onUpdate(dt: number)
    dt = clamp(dt, 0, 0.05)

    if Gorbus.isKeyJustPressed("t") then
        if not Gorbus.find(PLAYER) then
            return
        end
        resetRound()
        Gorbus.lockMouse(true)
    end

    if not active then
        return
    end

    local player = Gorbus.getObjectPosition(PLAYER)
    if not player then
        if not playerMissingNotice then
            Gorbus.log("STRYDE: no se encuentra el jugador. Deteniendo la ronda.")
            playerMissingNotice = true
        end
        active = false
        Gorbus.lockMouse(false)
        return
    end

    local mouse = Gorbus.getMouseDelta()
    local sensitivity = MOUSE_SENSITIVITY
    if Gorbus.isMouseButtonDown(2) then
        sensitivity *= 0.58
    end
    yaw -= (mouse.x or 0) * sensitivity
    pitch = clamp(pitch - (mouse.y or 0) * sensitivity, -1.35, 1.35)

    local speed = 6.2
    if Gorbus.isKeyDown("shift") then
        speed = 9.2
    end
    Gorbus.setCameraPosition(player.x, player.y + 0.62, player.z)
    Gorbus.setCameraRotation(pitch, yaw, 0)
    Gorbus.controlCharacter(speed, 6.8, PLAYER)

    if Gorbus.isKeyJustPressed("1") then scanModeIndex = 1; Gorbus.showGameMessage("MODO · " .. scanModes[scanModeIndex].name); Gorbus.log("MODO · " .. scanModes[scanModeIndex].name) end
    if Gorbus.isKeyJustPressed("2") then scanModeIndex = 2; Gorbus.showGameMessage("MODO · " .. scanModes[scanModeIndex].name); Gorbus.log("MODO · " .. scanModes[scanModeIndex].name) end
    if Gorbus.isKeyJustPressed("3") then scanModeIndex = 3; Gorbus.showGameMessage("MODO · " .. scanModes[scanModeIndex].name); Gorbus.log("MODO · " .. scanModes[scanModeIndex].name) end
    if Gorbus.isKeyJustPressed("4") then scanModeIndex = 4; Gorbus.showGameMessage("MODO · " .. scanModes[scanModeIndex].name); Gorbus.log("MODO · " .. scanModes[scanModeIndex].name) end

    scanCooldown = math.max(0, scanCooldown - dt)
    if Gorbus.isMouseButtonDown(0) and scanCooldown <= 0 then
        sendScanPulse()
    end

    elapsed += dt
    remaining = math.max(0, ROUND_SECONDS - elapsed)
    updateBeacons(dt)

    local wholeSeconds = math.floor(remaining)
    if wholeSeconds <= 30 and wholeSeconds % 10 == 0 and wholeSeconds ~= lastTimeNotice then
        lastTimeNotice = wholeSeconds
        Gorbus.log("TIEMPO RESTANTE · " .. tostring(wholeSeconds) .. " s · PUNTOS " .. tostring(score))
    end

    if Gorbus.isKeyJustPressed("tab") then
        local accuracy = 0
        if scans > 0 then accuracy = math.floor((successfulScans / scans) * 100 + 0.5) end
        Gorbus.log("MARCADOR · " .. tostring(score) .. " pts · " .. tostring(activatedNodes) .. " balizas · " .. tostring(accuracy) .. "% precisión")
    end

    updateHUD("--")
    if remaining <= 0 then
        finishRound()
    end
end

function onStop()
    Gorbus.lockMouse(false)
    Gorbus.setObjectVisible(PLAYER, true)
    Gorbus.clearGameHUD()
    Gorbus.log("STRYDE: sesión detenida.")
end
