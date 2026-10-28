export const EXACT_MESSAGES: Record<string, string> = {
  // Safeguards & Layout Constraints
  "cannot disable the last active display":
    "无法断开最后一台活动显示器。",
  "Cannot detach the last active display.":
    "无法断开最后一台活动显示器。",
  "Keep at least one monitor active.": "请至少保留一台活动显示器。",
  "Keep at least one display active": "请至少保留一台活动显示器。",
  "layout cannot be empty": "布局不能为空。",
  "layout must have at least one enabled display":
    "布局必须至少包含一台启用的显示器。",
  "layout has multiple primary displays": "布局存在多个主显示器。",
  "layout contains a duplicate display target":
    "布局包含重复的显示器目标。",
  "invalid clone group or scaling percentage":
    "复制组或缩放百分比无效。",
  "duplicated displays must share position, resolution, scaling and primary status":
    "复制的显示器必须具有相同的位置、分辨率、缩放比例和主显示器状态。",
  "display geometry or refresh rate is out of range":
    "显示器几何参数或刷新率超出范围。",
  "extended displays overlap; move them apart or choose Duplicate of":
    "扩展显示器存在重叠；请将其移开或选择“复制自”。",
  "Monitors overlap. Drag them apart before saving the layout.":
    "显示器存在重叠。保存布局前请将其拖开。",
  "Display edges must touch. Drag the monitors together to remove gaps before saving.":
    "显示器边缘必须相接。保存前请将显示器拖到一起以消除间隙。",
  "Move monitors closer to the desktop origin.":
    "请将显示器移近桌面原点。",
  "A monitor is no longer available. Refresh the layout before saving.":
    "某台显示器已不可用。请在保存前刷新布局。",
  "Choose a supported resolution and refresh rate in the monitor’s properties.":
    "请在显示器属性中选择受支持的分辨率和刷新率。",
  "Choose an active display to duplicate.":
    "请选择一台活动显示器进行复制。",
  "Windows reports no shared resolution for these monitors. Extend and refresh them to enumerate their modes before duplicating.":
    "Windows 报告这些显示器之间没有共享分辨率。请在复制前将它们设为扩展并刷新以枚举其模式。",
  "Windows cannot report a shared scaling value for these monitors. Extend and refresh them before duplicating.":
    "Windows 无法报告这些显示器之间的共享缩放比例。请在复制前将它们设为扩展并刷新。",
  "gap closure requires a primary display": "消除间隙需要指定主显示器。",
  "cannot close gaps after skipping a missing display with automatic monitor geometry; save the profile with explicit resolutions":
    "跳过缺失的显示器后无法消除自动显示器几何布局留下的间隙；请使用明确的分辨率保存配置方案。",
  "cannot close gaps left by missing displays without overlap; adjust and re-save the profile":
    "无法在不重叠的情况下消除缺失显示器留下的间隙；请调整并重新保存配置方案。",
  "cannot place the attached monitor beside the active desktop; adjust the display arrangement and try again":
    "无法将重新连接的显示器放置在活动桌面旁；请调整显示器排列后重试。",
  "Settings could not be applied. Review the reported error and try again.":
    "无法应用设置。请检查报告的错误并重试。",

  // Confirmation
  "a layout change is pending confirmation":
    "布局更改正在等待确认。",
  "a layout is awaiting confirmation":
    "布局更改正在等待确认。",
  "no pending confirmation": "没有正在等待确认的布局更改。",
  "no layout is awaiting confirmation":
    "没有正在等待确认的布局更改。",

  // Profile & Audio Output
  "profile name cannot be empty": "配置方案名称不能为空。",
  "invalid audio output": "无效的音频输出设备。",
  "invalid audio endpoint ID": "无效的音频终端 ID。",
  "audio output; reconnect it and refresh the device list":
    "音频输出设备；请重新连接并刷新设备列表。",
  "Audio output not found; reconnect the device or select another output.":
    "未找到音频输出设备；请重新连接该设备或选择其他输出。",
  "Audio output unavailable; connect or enable the device, or select another output for this profile.":
    "音频输出设备不可用；请连接或启用该设备，或为此配置方案选择其他输出。",
  "profile maps multiple displays to the same connected monitor":
    "配置方案将多台显示器映射到了同一台已连接的显示器。",
  "display identity is ambiguous; reconnect the intended monitor on its saved port or re-save the profile":
    "显示器标识存在多义性；请将目标显示器重新连接到其保存的端口，或重新保存配置方案。",
  "no enabled profile displays are connected; layout was not changed":
    "配置方案中启用的显示器均未连接；布局未更改。",
  "invalid display key": "无效的显示器标识。",
  "last restorable layout": "上次可还原的布局",
  "Display unavailable; reconnect it before applying.":
    "显示器不可用；应用前请先重新连接。",
  "Windows did not keep the selected audio output; check for another app changing the default device":
    "Windows 未保留所选的音频输出设备；请检查是否有其他程序更改了默认设备。",
  "Unavailable TV audio outputs can be saved; Monarch waits for them when the display activates. Communications devices keep their Windows preference.":
    "不可用的电视音频输出仍可保存；当显示器激活时，Monarch 会等待其可用。通信设备保留其 Windows 首选项。",

  // Capabilities & Reasons
  "cannot capture HDR/scaling for recovery; refresh the display or choose Preserve":
    "无法捕获用于恢复的 HDR/缩放设置；请刷新显示器或选择“保持”。",
  "HDR unavailable; choose Preserve HDR.":
    "HDR 不可用；请选择“保持 HDR”。",
  "Unsupported scaling; choose Preserve scaling.":
    "缩放不受支持；请选择“保持缩放”。",
  "Unsupported resolution/refresh combination; select a reported mode.":
    "分辨率/刷新率组合不受支持；请选择已报告的模式。",
  "Windows has not reported the full mode list. Extend and refresh this monitor to enumerate additional modes. Saved preferences are retained.":
    "Windows 尚未报告完整的模式列表。请扩展并刷新此显示器以枚举更多模式。已保存的偏好设置将予以保留。",
  "HDR is unsupported or unavailable in the current Windows configuration.":
    "在当前 Windows 配置下，HDR 不受支持或不可用。",
  "HDR is unsupported on this monitor.": "此显示器不支持 HDR。",
  "Windows cannot read this source's standard scaling range. Attach the display and turn off custom scaling in Windows.":
    "Windows 无法读取此信号源的标准缩放范围。请重新连接显示器并在 Windows 中关闭自定义缩放。",
  "Scaling is unavailable while this monitor is detached.":
    "断开此显示器期间无法调整缩放。",
  "Windows cannot read HDR state": "Windows 无法读取 HDR 状态。",
  "HDR is unavailable in this display configuration":
    "HDR 在此显示配置下不可用。",
  "Windows cannot read per-monitor scaling; custom scaling is unsupported":
    "Windows 无法读取每台显示器的独立缩放；不支持自定义缩放。",
  "display disappeared before HDR/scaling could be applied":
    "在应用 HDR/缩放之前显示器已消失。",

  // Windows SDC & Backend
  "Windows applied different display duplication; previous settings must be restored":
    "Windows 应用了不同的显示器复制关系；必须还原先前的设置。",
  "Windows rejected the display configuration data (87). Refresh the display list and try again; if this repeats, include the Monarch diagnostic log in the report.":
    "Windows 拒绝了显示配置数据 (87)。请刷新显示器列表后重试；如果问题持续出现，请在报告中附带 Monarch 诊断日志。",
  "display topology kept changing during enumeration; try again":
    "枚举期间显示器拓扑持续发生变化；请重试。",
  "layout enables the same Windows display target more than once":
    "布局多次启用了同一个 Windows 显示器目标。",
  "Windows reports no compatible source assignment for the requested duplicate/extend groups; choose Extend or a different group":
    "Windows 报告请求的复制/扩展组没有兼容的信号源分配；请选择“扩展”或其他分组。",
  "windows backend cache poisoned": "Windows 后端缓存锁因线程异常而不可用。",
  "mock backend lock poisoned": "模拟后端锁因线程异常而不可用。",
  "memory config store lock poisoned": "内存配置存储锁因线程异常而不可用。",
  "simulated apply failure": "模拟应用失败。",

  // Coordinator and IPC status; an unknown outcome is not a failed operation.
  "Audio output switching is unavailable on this backend": "此后端无法切换音频输出。",
  "Monarch is busy; the operation was not queued": "Monarch 正忙；此次操作未加入队列。",
  "Monarch is busy; request was not queued": "Monarch 正忙；此次请求未加入队列。",
  "display worker stopped": "显示器工作线程已停止。",
  "display worker stopped before reporting the result": "显示器工作线程在报告结果前已停止。",
  "snapshot lock poisoned": "快照锁因线程异常而不可用。",
  "shortcut sync lock poisoned": "快捷键同步锁因线程异常而不可用。",
  "running instance did not become ready": "正在运行的实例未能就绪。",
  "IPC write timed out": "IPC 写入超时。",
  "IPC acknowledgement timed out; submission outcome is unknown": "IPC 确认超时；提交结果未知。",

  // Settings & App
  "revert timeout must be between 1 and 60 seconds":
    "还原超时时间必须在 1 到 60 秒之间。",
  "Revert timeout must be a whole number between 1 and 60.":
    "还原超时时间必须是 1 到 60 之间的整数。",
  "Enter a whole number between 1 and 60.":
    "请输入 1 到 60 之间的整数。",
  "profile and monitor shortcut bases must be different":
    "配置方案与显示器的快捷键修饰键组合不能相同。",
  "Profile and monitor shortcut bases must be different.":
    "配置方案与显示器的快捷键修饰键组合不能相同。",
  "configuration contains unsupported profiles or settings":
    "配置包含不受支持的配置方案或设置。",
  "single-instance IPC is supported on Windows":
    "单实例 IPC 仅在 Windows 上受支持。",
  "worker stopped; outcome unknown": "工作线程已停止；执行结果未知。",
  "invalid IPC frame": "无效的 IPC 帧。",
  "IPC frame exceeds 8 KiB": "IPC 帧大小超过 8 KiB。",
  "invalid IPC completion": "无效的 IPC 完成状态。",
  "url cannot be empty": "URL 不能为空。",
  "URL cannot be empty": "URL 不能为空。",
  "Invalid URL": "无效的 URL。",
  "only http(s) URLs are supported": "仅支持 http(s) URL。",
  "Only http(s) URLs are supported": "仅支持 http(s) URL。",
  "opening external URLs is not supported on this platform":
    "当前平台不支持打开外部 URL。",
  "GitHub releases response missing tag_name":
    "GitHub Releases 响应缺少 tag_name。",
};

export const AUDIO_OPERATIONS: Record<string, string> = {
  initialization: "初始化",
  enumeration: "设备枚举",
  "output switching support": "输出切换支持",
  "default output query": "查询默认输出",
  "media output query": "查询媒体输出",
  "communications output query": "查询通信输出",
  "device list": "获取设备列表",
  "output selection": "选择输出设备",
};
