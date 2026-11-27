--!strict
-- STRYDE / Gorbus Engine — Port 0.1
-- Primer corte jugable: Campo Orión (Entrenamiento).
-- Requiere GE 2.1 con la API de botones del ratón.

local PLAYER = "Stryde_Player"
local ROUND_SECONDS = 60
local MOUSE_SENSITIVITY = 0.0022

local weapons = {
    { name = "S-9 PULSE", damage = 25, interval = 0.11 },
    { name = "K-2 AURA", damage = 40, interval = 0.22 },
    { name = "BREAKER-8", damage = 18, interval = 0.48 },
    { name = "LANCE-X", damage = 100, interval = 0.85 },
}

local targets = {
    { name = "Stryde_Target_01", x = -9, y = 1.35, z = -7, moving = true, range = 2.2, speed = 1.1, phase = 0.0, health = 100, respawn = 0, moveClock = 0 },
    { name = "Stryde_Target_02", x = -5, y = 1.35, z = -10, moving = false, range = 0, speed = 0, phase = 0.8, health = 100, respawn = 0, moveClock = 0 },
    { name = "Stryde_Target_03", x = 0, y = 1.35, z = -8, moving = true, range = 2.8, speed = 1.5, phase = 1.6, health = 100, respawn = 0, moveClock = 0 },
    { name = "Stryde_Target_04", x = 5, y = 1.35, z = -10, moving = false, range = 0, speed = 0, phase = 2.4, health = 100, respawn = 0, moveClock = 0 },
    { name = "Stryde_Target_05", x = 9, y = 1.35, z = -7, moving = true, range = 2.0, speed = 1.25, phase = 3.2, health = 100, respawn = 0, moveClock = 0 },
    { name = "Stryde_Target_06", x = 0, y = 1.35, z = -13, moving = false, range = 0, speed = 0, phase = 4.0, health = 100, respawn = 0, moveClock = 0 },
}

local yaw = 0
local pitch = 0
local elapsed = 0
local remaining = ROUND_SECONDS
local score = 0
local shots = 0
local hits = 0
local eliminations = 0
local weaponIndex = 1
local fireCooldown = 0
local targetUpdateClock = 0
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

local function targetByName(name: string)
    for _, target in ipairs(targets) do
        if target.name == name then
            return target
        end
    end
    return nil
end

local function resetTarget(target)
    target.health = 100
    target.respawn = 0
    target.moveClock = 0
    Gorbus.setPosition(target.name, target.x, target.y, target.z)
    Gorbus.setColor(target.name, "#a8dcff")
end

local function accuracyPercent(): number
    if shots <= 0 then return 0 end
    return math.floor((hits / shots) * 100 + 0.5)
end

local function updateHUD(rank: string?)
    Gorbus.setGameHUD(remaining, score, accuracyPercent(), weapons[weaponIndex].name, eliminations, rank or "--")
end

local function resetRound()
    elapsed = 0
    remaining = ROUND_SECONDS
    score = 0
    shots = 0
    hits = 0
    eliminations = 0
    weaponIndex = 1
    fireCooldown = 0
    targetUpdateClock = 0
    active = true
    finished = false
    lastTimeNotice = ROUND_SECONDS
    yaw = 0
    pitch = 0
    updateHUD("--")
    Gorbus.showGameMessage("CAMPO ORIÓN · NUEVA RONDA")

    for _, target in ipairs(targets) do
        resetTarget(target)
    end

    local player = Gorbus.getObjectPosition(PLAYER)
    if player then
        Gorbus.setPosition(PLAYER, 0, 0.95, 9)
        Gorbus.setVelocity(PLAYER, 0, 0, 0)
    end

    Gorbus.log("STRYDE · NUEVA RONDA | 60 segundos | munición infinita")
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
    Gorbus.log("IMPACTOS: " .. tostring(hits) .. " / " .. tostring(shots) .. " | PRECISIÓN: " .. tostring(accuracy) .. "%")
    Gorbus.log("OBJETIVOS: " .. tostring(eliminations) .. " eliminados")
    Gorbus.log("Pulsa T para repetir el entrenamiento.")
end

local function updateTargets(dt: number)
    targetUpdateClock += dt
    for _, target in ipairs(targets) do
        if target.respawn > 0 then
            target.respawn = math.max(0, target.respawn - dt)
            if target.respawn == 0 then
                resetTarget(target)
            end
        elseif target.moving and targetUpdateClock >= 0.06 then
            local offset = math.sin(elapsed * target.speed + target.phase) * target.range
            Gorbus.setPosition(target.name, target.x + offset, target.y, target.z)
        end
    end
    if targetUpdateClock >= 0.06 then
        targetUpdateClock = 0
    end
end

local function fireShot()
    local weapon = weapons[weaponIndex]
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

    shots += 1
    fireCooldown = weapon.interval

    if not result then
        return
    end

    local target = targetByName(result.name)
    if not target or target.respawn > 0 then
        return
    end

    hits += 1
    score += 25
    target.health -= weapon.damage

    if target.health <= 0 then
        eliminations += 1
        score += 75
        target.respawn = 1.7
        Gorbus.setPosition(target.name, target.x, -35, target.z)
        Gorbus.setColor(target.name, "#4a5664")
        Gorbus.showGameMessage("OBJETIVO ELIMINADO · +100")
        Gorbus.log("OBJETIVO DESTRUIDO · +100 · TOTAL " .. tostring(score))
    else
        Gorbus.setColor(target.name, "#ff9b55")
        Gorbus.showGameMessage("IMPACTO · +25")
        Gorbus.log("IMPACTO · " .. result.name .. " · " .. tostring(math.max(0, target.health)) .. "%")
    end
end

function onStart()
    if not Gorbus.find(PLAYER) then
        Gorbus.log("ERROR STRYDE: falta el objeto Stryde_Player con Rigidbody y Capsule Collider.")
        active = false
        return
    end

    for _, target in ipairs(targets) do
        if not Gorbus.find(target.name) then
            Gorbus.log("ERROR STRYDE: falta el objetivo " .. target.name)
            active = false
            return
        end
    end

    -- La física ya fue construida antes de onStart; ocultamos solo el modelo visual
    -- para evitar que la cápsula del jugador tape la cámara en primera persona.
    Gorbus.setObjectVisible(PLAYER, false)
    Gorbus.setGameHUD(ROUND_SECONDS, score, 0, weapons[weaponIndex].name, eliminations, "--")
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
    Gorbus.log("Clic izq. disparar · Clic der. apuntar · 1–4 cambiar arma · T reiniciar")
    Gorbus.log("ENTRENAMIENTO: 60 s, objetivos móviles y munición infinita.")
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

    if Gorbus.isKeyJustPressed("1") then weaponIndex = 1; Gorbus.showGameMessage("ARMA · " .. weapons[weaponIndex].name); Gorbus.log("ARMA · " .. weapons[weaponIndex].name) end
    if Gorbus.isKeyJustPressed("2") then weaponIndex = 2; Gorbus.showGameMessage("ARMA · " .. weapons[weaponIndex].name); Gorbus.log("ARMA · " .. weapons[weaponIndex].name) end
    if Gorbus.isKeyJustPressed("3") then weaponIndex = 3; Gorbus.showGameMessage("ARMA · " .. weapons[weaponIndex].name); Gorbus.log("ARMA · " .. weapons[weaponIndex].name) end
    if Gorbus.isKeyJustPressed("4") then weaponIndex = 4; Gorbus.showGameMessage("ARMA · " .. weapons[weaponIndex].name); Gorbus.log("ARMA · " .. weapons[weaponIndex].name) end

    fireCooldown = math.max(0, fireCooldown - dt)
    if Gorbus.isMouseButtonDown(0) and fireCooldown <= 0 then
        fireShot()
    end

    elapsed += dt
    remaining = math.max(0, ROUND_SECONDS - elapsed)
    updateTargets(dt)

    local wholeSeconds = math.floor(remaining)
    if wholeSeconds <= 30 and wholeSeconds % 10 == 0 and wholeSeconds ~= lastTimeNotice then
        lastTimeNotice = wholeSeconds
        Gorbus.log("TIEMPO RESTANTE · " .. tostring(wholeSeconds) .. " s · PUNTOS " .. tostring(score))
    end

    if Gorbus.isKeyJustPressed("tab") then
        local accuracy = 0
        if shots > 0 then accuracy = math.floor((hits / shots) * 100 + 0.5) end
        Gorbus.log("MARCADOR · " .. tostring(score) .. " pts · " .. tostring(eliminations) .. " objetivos · " .. tostring(accuracy) .. "% precisión")
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
