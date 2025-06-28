const form = document.getElementById("formulario");
const formStock = document.getElementById("form-stock-inicial");
const tablaStock = document.getElementById("tablaStock");
const registrosDiv = document.getElementById("registros");

let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
let stock = JSON.parse(localStorage.getItem("stock")) || {};

function renderizarRegistros() {
  registrosDiv.innerHTML = "";
  inventario.forEach(i => {
    const div = document.createElement("div");
    div.textContent = `${i.fecha} - ${i.persona}: ${i.codigo} - ${i.descripcion} [${i.movimiento} ${i.cantidad}]`;
    registrosDiv.appendChild(div);
  });
}

function renderizarStock() {
  tablaStock.innerHTML = "";
  for (const cod in stock) {
    const item = stock[cod];
    const totalMov = inventario.filter(i => i.codigo === cod).reduce((s, i) => {
      return s + (i.movimiento === "Ingreso" ? i.cantidad : -i.cantidad);
    }, 0);
    const disponible = item.inicial + totalMov;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cod}</td>
      <td>${item.descripcion}</td>
      <td>${item.inicial}</td>
      <td>${totalMov}</td>
      <td class="${disponible < 0 ? 'stock-bajo' : ''}">${disponible}</td>
      <td>
        <button onclick="editarStock('${cod}')">✏️</button>
        <button onclick="eliminarStock('${cod}')">❌</button>
      </td>`;
    tablaStock.appendChild(tr);
  }
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const movimiento = document.getElementById("movimiento").value;
  const codigo = document.getElementById("codigo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const persona = document.getElementById("persona").value.trim();

  if (!codigo || !descripcion || isNaN(cantidad) || cantidad <= 0 || !persona) return;

  if (!stock[codigo]) {
    alert("⚠️ Este ítem no está en el stock inicial. Agregalo primero.");
    return;
  }  if (movimiento === "Egreso") {
    const totalMov = inventario.filter(i => i.codigo === codigo).reduce((s, i) => {
      return s + (i.movimiento === "Ingreso" ? i.cantidad : -i.cantidad);
    }, 0);
    const disponible = stock[codigo].inicial + totalMov;
    if (cantidad > disponible) {
      alert("⚠️ Stock insuficiente.");
      return;
    }
  }

  if (movimiento === "Ingreso") {
    const totalEgresos = inventario
      .filter(i => i.codigo === codigo && i.movimiento === "Egreso")
      .reduce((s, i) => s + i.cantidad, 0);
    const totalIngresos = inventario
      .filter(i => i.codigo === codigo && i.movimiento === "Ingreso")
      .reduce((s, i) => s + i.cantidad, 0);
    const faltante = totalEgresos - totalIngresos;
    if (faltante <= 0) {
      alert(`✅ No hay egresos pendientes para ${descripcion}.`);
      return;
    }
    if (cantidad > faltante) {
      alert(`⚠️ El ingreso supera los egresos pendientes. Máximo permitido: ${faltante}.`);
      return;
    }
  }

  inventario.push({
    codigo,
    descripcion,
    movimiento,
    cantidad,
    persona,
    fecha: new Date().toLocaleString()
  });

  localStorage.setItem("inventario", JSON.stringify(inventario));
  form.reset();
  renderizarRegistros();
  renderizarStock();
});

formStock.addEventListener("submit", e => {
  e.preventDefault();
  const codigo = document.getElementById("codigoStock").value.trim();
  const descripcion = document.getElementById("descripcionStock").value.trim() || "-";
  const cantidad = parseInt(document.getElementById("stockInicial").value) || 0;
  if (!codigo) return;

  stock[codigo] = { descripcion, inicial: cantidad };
  localStorage.setItem("stock", JSON.stringify(stock));
  formStock.reset();
  renderizarStock();
});document.getElementById("btn-limpiar").addEventListener("click", () => {
  if (confirm("¿Borrar todos los movimientos?")) {
    inventario = [];
    localStorage.setItem("inventario", JSON.stringify(inventario));
    renderizarRegistros();
    renderizarStock();
  }
});

document.getElementById("descargarExcel").addEventListener("click", () => {
  const data = inventario.map(i => ({
    Fecha: i.fecha,
    Movimiento: i.movimiento,
    Código: i.codigo,
    Descripción: i.descripcion,
    Cantidad: i.cantidad,
    Persona: i.persona
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventario");
  XLSX.writeFile(wb, "inventario.xlsx");
});

// Escaneo por QR - Movimiento
document.getElementById("btn-escanear").addEventListener("click", () => {
  const qrArea = document.getElementById("qr-reader");
  qrArea.innerHTML = "";
  const escaner = new Html5Qrcode("qr-reader");
  escaner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    codigo => {
      document.getElementById("codigo").value = codigo;
      escaner.stop().then(() => {
        qrArea.innerHTML = "";
      });
    }
  ).catch(err => alert("Error al acceder a la cámara: " + err));
});

// Escaneo por QR - Alta en stock
document.getElementById("btn-escanear-stock").addEventListener("click", () => {
  const qrArea = document.getElementById("qr-reader-stock");
  qrArea.innerHTML = "";
  const escaner = new Html5Qrcode("qr-reader-stock");
  escaner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    codigo => {
      document.getElementById("codigoStock").value = codigo;
      escaner.stop().then(() => {
        qrArea.innerHTML = "";
      });
    }
  ).catch(err => alert("Error al acceder a la cámara: " + err));
});

// Navegación por pestañas
document.querySelectorAll(".tab").forEach(boton =>
  boton.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));
    boton.classList.add("active");
    document.getElementById(boton.dataset.tab).classList.add("active");
  })
);

// Ayuda
document.getElementById("btn-ayuda").addEventListener("click", () => {
  document.getElementById("modal-ayuda").style.display = "block";
});
document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("modal-ayuda").style.display = "none";
});
window.addEventListener("click", e => {
  if (e.target === document.getElementById("modal-ayuda")) {
    document.getElementById("modal-ayuda").style.display = "none";
  }
});

// Botón flotante para cambiar a pestaña "Stock"
document.getElementById("btn-ver-stock").addEventListener("click", () => {
  document.querySelector(".tab[data-tab='stock']").click();
});

// Instalación como PWA
let deferredPrompt;
const popup = document.getElementById("instalar-popup");
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  popup.style.display = "block";
});
document.getElementById("btn-confirmar-instalar").onclick = () => {
  popup.style.display = "none";
  if (deferredPrompt) deferredPrompt.prompt();
};
document.getElementById("btn-rechazar").onclick = () => {
  popup.style.display = "none";
};

// Funciones globales para edición
window.editarStock = function (cod) {
  const nuevo = prompt(`Nuevo stock inicial para ${stock[cod].descripcion} (${cod}):`, stock[cod].inicial);
  if (nuevo === null) return;
  const n = parseInt(nuevo);
  if (!isNaN(n) && n >= 0) {
    stock[cod].inicial = n;
    localStorage.setItem("stock", JSON.stringify(stock));
    renderizarStock();
  }
};

window.eliminarStock = function (cod) {
  if (confirm(`¿Eliminar el ítem "${stock[cod].descripcion}" (${cod}) del stock?`)) {
    delete stock[cod];
    localStorage.setItem("stock", JSON.stringify(stock));
    renderizarStock();
  }
};

// Inicialización al cargar
renderizarRegistros();
renderizarStock();

// Registrar Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}