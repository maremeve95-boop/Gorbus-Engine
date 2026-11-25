--!strict
-- Gorbus Engine — main.luau
-- API propia de Gorbus: no es el DataModel de Roblox.

local controlledObject: string = "Cube"

function onStart()
    if not Gorbus.find(controlledObject) then
        controlledObject = "Player"
    end

    Gorbus.log("¡Hola desde Gorbus Engine + Luau!")
    Gorbus.log("Controles: WASD para moverte · Espacio para impulsarte.")
end

function onUpdate(dt: number)
    if not Gorbus.find(controlledObject) then
        return
    end

    local moveX = 0
    local moveZ = 0

    if Gorbus.isKeyDown("a") then moveX -= 1 end
    if Gorbus.isKeyDown("d") then moveX += 1 end
    if Gorbus.isKeyDown("w") then moveZ -= 1 end
    if Gorbus.isKeyDown("s") then moveZ += 1 end

    if Gorbus.hasRigidbody(controlledObject) then
        Gorbus.setHorizontalVelocity(controlledObject, moveX * 4, moveZ * 4)

        if Gorbus.isKeyJustPressed("space") then
            Gorbus.applyImpulse(controlledObject, 0, 3.8, 0)
        end
    else
        Gorbus.move(controlledObject, moveX * 4 * dt, 0, moveZ * 4 * dt)
    end
end

function onStop()
    Gorbus.log("Prueba detenida.")
end
