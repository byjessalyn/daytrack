import Capacitor
import WidgetKit

/// Must match the App Group added to BOTH the App and DaytrackWidget targets
/// (Signing & Capabilities → App Groups). See IOS_SETUP.md.
let daytrackAppGroup = "group.com.byjessalyn.daytrack"

/// Receives the precomputed widget snapshot from the web app (src/lib/native.js),
/// stores it where the widget extension can read it, and asks iOS to redraw widgets.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setSnapshot", returnType: CAPPluginReturnPromise)
    ]

    @objc func setSnapshot(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else {
            call.reject("Missing json")
            return
        }
        guard let defaults = UserDefaults(suiteName: daytrackAppGroup) else {
            call.reject("App Group \(daytrackAppGroup) is not available")
            return
        }
        defaults.set(json, forKey: "snapshot")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}

/// Registers app-local plugins. Used as the root view controller in SceneDelegate.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
    }
}
