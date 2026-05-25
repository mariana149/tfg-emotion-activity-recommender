document.getElementById('inputFoto').addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    document.getElementById('errorFoto').classList.add('d-none');
    const reader = new FileReader();
    reader.onload = e => document.getElementById('previewFoto').src = e.target.result;
    reader.readAsDataURL(file);
});

async function subirFoto() {
    const file = document.getElementById('inputFoto').files[0];
    if (!file) {
        document.getElementById('errorFoto').classList.remove('d-none');
        return;
    }
    document.getElementById('errorFoto').classList.add('d-none');

    const formData = new FormData();
    formData.append('foto', file);

    const r = await fetch('/perfil/foto', { method: 'POST', body: formData });
    const d = await r.json();

    if (d.success) {
        const urlFoto = d.foto + '?t=' + Date.now();
        document.getElementById('avatarPerfil').src = urlFoto;
        document.getElementById('avatarNavbar').src = urlFoto;
        document.getElementById('previewFoto').src = urlFoto;
        document.getElementById('btnQuitarFoto').classList.remove('d-none');
        bootstrap.Modal.getInstance(document.getElementById('modalFoto')).hide();
    } else {
        alert(d.message);
    }
}

async function eliminarFoto() {
    if (!confirm('¿Quieres eliminar tu foto de perfil?')) return;

    const r = await fetch('/perfil/foto/eliminar', { method: 'POST' });
    const d = await r.json();

    if (d.success) {
        const defecto = '/img/defaultFoto.png';
        document.getElementById('avatarPerfil').src = defecto;
        document.getElementById('avatarNavbar').src = defecto;
        document.getElementById('previewFoto').src = defecto;
        document.getElementById('btnQuitarFoto').classList.add('d-none');
        bootstrap.Modal.getInstance(document.getElementById('modalFoto')).hide();
    } else {
        alert(d.message);
    }
}

document.getElementById('modalFoto').addEventListener('hidden.bs.modal', function() {
    document.getElementById('errorFoto').classList.add('d-none');
    document.getElementById('inputFoto').value = '';
    document.getElementById('previewFoto').src = document.getElementById('avatarPerfil').src;
});

function confirmarEliminacion() {
    return confirm("¿Seguro que quieres eliminar tu cuenta?\n\nEsta acción eliminará todos tus datos y no se puede deshacer.");
}

document.getElementById('btnGuardarPassword').addEventListener('click', function(e) {
    const p1 = document.querySelector('[name=newPassword]').value;
    const p2 = document.getElementById('repetirPassword').value;
    if (p1 !== p2) {
        e.preventDefault();
        document.getElementById('errorPassword').classList.remove('d-none');
    } else {
        document.getElementById('errorPassword').classList.add('d-none');
    }
});

document.getElementById('modalDatos').addEventListener('hidden.bs.modal', function() {
    this.querySelectorAll('input').forEach(input => {
        input.value = input.defaultValue;
    });
});

document.getElementById('modalPassword').addEventListener('hidden.bs.modal', function() {
    this.querySelectorAll('input').forEach(input => input.value = '');
    document.getElementById('errorPassword').classList.add('d-none');
});