--!strict
-- NEON RELAY — Gorbus Engine 2.1.0 test game
-- Test coverage: scene loading, capsule physics, first-person camera,
-- mouse input, keyboard input, proximity gameplay, runtime transforms and HUD.

local PLAYER = "Relay_Player"
local ROUND_SECONDS = 90
local TOTAL_CORES = 9
local CORE_NAMES = {
    "Relay_Core_01", "Relay_Core_02", "Relay_Core_03",
    "Relay_Core_04", "Relay_Core_05", "Relay_Core_06",
    "Relay_Core_07", "Relay_Core_08", "Relay_Core_09",
}

local elapsed = 0
local remaining = ROUND_SECONDS
local collected = 0
local score = 0
local active = true
local finished = false
local yaw = 0
local pitch = 0
local noticeClock = 0

local function clamp(value: number, low: number, high: number): number
    return math.max(low, math.min(high, value))
end

local function distance(a, b): number
    local dx = a.x - b.x
    local dy = a.y - b.y
    local dz = a.z - b.z
    return math.sqrt(dx * dx + dy * dy + dz * dz)
end

local function updateHUD()
    local progress = math.floor((collected / TOTAL_CORES) * 100 + 0.5)
    Gorbus.setGameHUD(remaining, score, progress, "NEON RELAY", collected, collected == TOTAL_CORES and "S" or "--")
end

local function finishGame(won: boolean)
    if finished then return end
    finished = true
    active = false
    Gorbus.lockMouse(false)
    if won then
        score += math.floor(remaining) * 10
        Gorbus.showGameMessage("¡RELEVO COMPLETADO! · +" .. tostring(math.floor(remaining) * 10) .. " BONUS")
        Gorbus.log("NEON RELAY · VICTORIA · PUNTUACIÓN FINAL: " .. tostring(score))
    else
        Gorbus.showGameMessage("TIEMPO AGOTADO · PULSA T PARA REINTENTAR")
        Gorbus.log("NEON RELAY · TIEMPO AGOTADO · CORES: " .. tostring(collected) .. "/" .. tostring(TOTAL_CORES))
    end
    updateHUD()
end

local function resetGame()
    elapsed = 0
    remaining = ROUND_SECONDS
    collected = 0
    score = 0
    active = true
    finished = false
    yaw = 0
    pitch = 0
    noticeClock = 0
    Gorbus.setPosition(PLAYER, 0, 0.95, 13)
    Gorbus.setVelocity(PLAYER, 0, 0, 0)
    for _, name in ipairs(CORE_NAMES) do
        Gorbus.setObjectVisible(name, true)
    end
    updateHUD()
    Gorbus.showGameMessage("NEON RELAY · ¡ENCUENTRA LOS 9 NÚCLEOS!")
    Gorbus.lockMouse(true)
end

function onStart()
    if not Gorbus.find(PLAYER) then
        Gorbus.log("ERROR: falta Relay_Player. Abre el proyecto con Gorbus Engine 2.1.0.")
        active = false
        return
    end
    for _, name in ipairs(CORE_NAMES) do
        if not Gorbus.find(name) then
            Gorbus.log("ERROR: falta el coleccionable " .. name)
            active = false
            return
        end
    end
    Gorbus.setObjectVisible(PLAYER, false)
    Gorbus.setCameraMode("game", 0.1)
    Gorbus.setCameraPosition(0, 1.57, 13)
    Gorbus.setCameraRotation(0, 0, 0)
    Gorbus.setGameHUD(ROUND_SECONDS, 0, 0, "NEON RELAY", 0, "--")
    Gorbus.showGameMessage("NEON RELAY · RECOGE LOS 9 NÚCLEOS")
    Gorbus.lockMouse(true)
    Gorbus.log("NEON RELAY · CONTROLES: WASD, SHIFT, ESPACIO, RATÓN Y T")
    Gorbus.log("Recoge los nueve núcleos luminosos antes de que termine el tiempo.")
end

function onUpdate(dt: number)
    dt = clamp(dt, 0, 0.05)
    if Gorbus.isKeyJustPressed("t") then
        resetGame()
    end
    if not active then return end

    local player = Gorbus.getObjectPosition(PLAYER)
    if not player then
        active = false
        Gorbus.lockMouse(false)
        Gorbus.log("ERROR: se ha perdido Relay_Player.")
        return
    end

    local mouse = Gorbus.getMouseDelta()
    yaw -= (mouse.x or 0) * 0.0022
    pitch = clamp(pitch - (mouse.y or 0) * 0.0022, -1.3, 1.3)
    Gorbus.setCameraPosition(player.x, player.y + 0.62, player.z)
    Gorbus.setCameraRotation(pitch, yaw, 0)

    local speed = Gorbus.isKeyDown("shift") and 9.0 or 6.0
    Gorbus.controlCharacter(speed, 6.8, PLAYER)

    for _, name in ipairs(CORE_NAMES) do
        local core = Gorbus.getObjectPosition(name)
        if core and core.y > -10 and distance(player, core) < 1.65 then
            Gorbus.setObjectVisible(name, false)
            Gorbus.setPosition(name, core.x, -30, core.z)
            collected += 1
            score += 100
            Gorbus.showGameMessage("NÚCLEO RECOGIDO · +100")
            Gorbus.log("NÚCLEO " .. tostring(collected) .. "/" .. tostring(TOTAL_CORES) .. " · PUNTOS " .. tostring(score))
            updateHUD()
        end
    end

    elapsed += dt
    remaining = math.max(0, ROUND_SECONDS - elapsed)
    noticeClock += dt
    if noticeClock >= 0.2 then
        updateHUD()
        noticeClock = 0
    end

    if collected >= TOTAL_CORES then
        finishGame(true)
    elseif remaining <= 0 then
        finishGame(false)
    end
end

function onStop()
    Gorbus.lockMouse(false)
    Gorbus.setObjectVisible(PLAYER, true)
    Gorbus.clearGameHUD()
    Gorbus.log("NEON RELAY · SESIÓN FINALIZADA")
end
