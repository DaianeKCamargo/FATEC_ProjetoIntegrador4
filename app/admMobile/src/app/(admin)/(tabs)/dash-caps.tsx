import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';

type Donation = {
  id: number;
  data: string;
  quantidadeKg: number;
  tipo: 'MANUAL' | 'BALANCA';
  responsavel: string;
};

const doacoesIniciais: Donation[] = [
  {
    id: 1,
    data: '2026-11-08',
    quantidadeKg: 12.5,
    tipo: 'BALANCA',
    responsavel: 'Ponto de coleta Centro',
  },
  {
    id: 2,
    data: '2026-11-07',
    quantidadeKg: 8.2,
    tipo: 'MANUAL',
    responsavel: 'Administradora',
  },
  {
    id: 3,
    data: '2026-11-05',
    quantidadeKg: 16.4,
    tipo: 'BALANCA',
    responsavel: 'Ponto de coleta Vila Nova',
  },
  {
    id: 4,
    data: '2026-10-28',
    quantidadeKg: 5.7,
    tipo: 'MANUAL',
    responsavel: 'Administradora',
  },
];

const converterUnidades = (kg: number) => Math.round(kg * 500);

const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
};

export default function DashRegistration() {
  const [doacoes, setDoacoes] = useState(doacoesIniciais);

  const [data, setData] = useState('2026-11-09');
  const [peso, setPeso] = useState('');

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [filtroDia, setFiltroDia] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAno, setFiltroAno] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState('TODOS');

  const doacoesFiltradas = useMemo(() => {
    return doacoes
      .filter((item) => {
        const [ano, mes, dia] = item.data.split('-');

        const correspondeDia =
          !filtroDia || dia === filtroDia.padStart(2, '0');

        const correspondeMes =
          !filtroMes || mes === filtroMes.padStart(2, '0');

        const correspondeAno =
          !filtroAno || ano === filtroAno;

        const correspondeResponsavel =
          filtroResponsavel === 'TODOS' ||
          item.tipo === filtroResponsavel;

        return (
          correspondeDia &&
          correspondeMes &&
          correspondeAno &&
          correspondeResponsavel
        );
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [doacoes, filtroDia, filtroMes, filtroAno, filtroResponsavel]);

  const totalKg = doacoesFiltradas.reduce(
    (total, item) => total + item.quantidadeKg,
    0
  );

  const totalDoacoes = doacoesFiltradas.length;

  const limparFiltros = () => {
    setFiltroDia('');
    setFiltroMes('');
    setFiltroAno('');
    setFiltroResponsavel('TODOS');
  };

  const salvarDoacao = () => {
    const pesoNumerico = Number(peso.replace(',', '.'));

    if (!data || !peso || !Number.isFinite(pesoNumerico) || pesoNumerico <= 0) {
      Alert.alert('Atenção', 'Informe uma data e um peso válido.');
      return;
    }

    if (editandoId !== null) {
      setDoacoes((anteriores) =>
        anteriores.map((item) =>
          item.id === editandoId
            ? { ...item, data, quantidadeKg: pesoNumerico }
            : item
        )
      );

      setEditandoId(null);
    } else {
      const novaDoacao: Donation = {
        id: Date.now(),
        data,
        quantidadeKg: pesoNumerico,
        tipo: 'MANUAL',
        responsavel: 'Administradora',
      };

      setDoacoes((anteriores) => [novaDoacao, ...anteriores]);
    }

    setPeso('');
    Alert.alert('Sucesso', 'Registro atualizado na demonstração.');
  };

  const editarDoacao = (item: Donation) => {
    setEditandoId(item.id);
    setData(item.data);
    setPeso(String(item.quantidadeKg));
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setPeso('');
    setData('2026-11-09');
  };

  const excluirDoacao = (id: number) => {
    Alert.alert(
      'Excluir doação',
      'Deseja realmente excluir este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            setDoacoes((anteriores) =>
              anteriores.filter((item) => item.id !== id)
            ),
        },
      ]
    );
  };

  const Campo = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'numeric';
  }) => (
    <View className="flex-1 gap-2">
      <Text className="text-sm font-semibold text-slate-600">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor="#94A3B8"
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800"
      />
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-slate-100"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-6">

        {/* CABEÇALHO */}
        <View className="gap-2">
          <Text className="text-3xl font-bold text-slate-800">
            Registros
          </Text>

          <Text className="text-base text-slate-500">
            Acompanhamento das doações de tampinhas
          </Text>
        </View>

        {/* RESUMO */}
        <View className="rounded-2xl bg-white p-5 shadow-sm">
          <Text className="mb-4 text-lg font-bold text-slate-800">
            Resumo das arrecadações
          </Text>

          <View className="flex-row gap-3">
            <View className="flex-1 rounded-xl bg-amber-50 p-4">
              <Text className="text-sm font-medium text-amber-800">
                Total arrecadado
              </Text>

              <Text className="mt-2 text-2xl font-bold text-amber-700">
                {totalKg.toFixed(2).replace('.', ',')} kg
              </Text>

              <Text className="mt-1 text-xs text-amber-700">
                Em tampinhas
              </Text>
            </View>

            <View className="flex-1 rounded-xl bg-blue-50 p-4">
              <Text className="text-sm font-medium text-blue-800">
                Doações
              </Text>

              <Text className="mt-2 text-2xl font-bold text-blue-700">
                {totalDoacoes}
              </Text>

              <Text className="mt-1 text-xs text-blue-700">
                Registros encontrados
              </Text>
            </View>
          </View>

          <Text className="mt-4 text-xs text-slate-400">
            Os valores são atualizados conforme os filtros selecionados.
          </Text>
        </View>

        {/* CADASTRO MANUAL */}
        <View className="rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-lg font-bold text-slate-800">
            {editandoId !== null ? 'Editar doação' : 'Cadastro manual'}
          </Text>

          <Text className="mb-5 mt-1 text-sm text-slate-500">
            Registro realizado pela administradora.
          </Text>

          <View className="gap-4">
            <Campo
              label="Data da doação"
              value={data}
              onChangeText={setData}
              placeholder="AAAA-MM-DD"
            />

            <Campo
              label="Quantidade em kg"
              value={peso}
              onChangeText={setPeso}
              placeholder="Ex.: 5,5"
              keyboardType="numeric"
            />

            <View className="rounded-xl bg-amber-50 p-4">
              <Text className="text-sm font-medium text-amber-800">
                Unidades estimadas
              </Text>

              <Text className="mt-1 text-xl font-bold text-amber-700">
                {peso && Number.isFinite(Number(peso.replace(',', '.')))
                  ? converterUnidades(Number(peso.replace(',', '.'))).toLocaleString('pt-BR')
                  : '0'}
              </Text>

              <Text className="mt-1 text-xs text-amber-700">
                Estimativa de 500 tampinhas por kg.
              </Text>
            </View>

            <Pressable
              onPress={salvarDoacao}
              className="items-center rounded-xl bg-amber-500 py-4 active:bg-amber-600"
            >
              <Text className="font-bold text-white">
                {editandoId !== null ? 'Salvar alterações' : 'Cadastrar doação'}
              </Text>
            </Pressable>

            {editandoId !== null && (
              <Pressable
                onPress={cancelarEdicao}
                className="items-center rounded-xl border border-slate-200 py-3"
              >
                <Text className="font-semibold text-slate-600">
                  Cancelar edição
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* FILTROS */}
        <View className="rounded-2xl bg-white p-5 shadow-sm">
          <Text className="mb-4 text-lg font-bold text-slate-800">
            Filtros
          </Text>

          <View className="flex-row gap-3">
            <Campo
              label="Dia"
              value={filtroDia}
              onChangeText={setFiltroDia}
              placeholder="DD"
              keyboardType="numeric"
            />

            <Campo
              label="Mês"
              value={filtroMes}
              onChangeText={setFiltroMes}
              placeholder="MM"
              keyboardType="numeric"
            />

            <Campo
              label="Ano"
              value={filtroAno}
              onChangeText={setFiltroAno}
              placeholder="AAAA"
              keyboardType="numeric"
            />
          </View>

          <Text className="mb-3 mt-5 text-sm font-semibold text-slate-600">
            Responsável
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {[
              { label: 'Todos', value: 'TODOS' },
              { label: 'Administradora', value: 'MANUAL' },
              { label: 'Pontos de coleta', value: 'BALANCA' },
            ].map((opcao) => (
              <Pressable
                key={opcao.value}
                onPress={() => setFiltroResponsavel(opcao.value)}
                className={`rounded-full px-4 py-2 ${
                  filtroResponsavel === opcao.value
                    ? 'bg-blue-600'
                    : 'bg-slate-100'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    filtroResponsavel === opcao.value
                      ? 'text-white'
                      : 'text-slate-600'
                  }`}
                >
                  {opcao.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={limparFiltros}
            className="mt-4 self-start"
          >
            <Text className="font-semibold text-blue-600">
              Limpar filtros
            </Text>
          </Pressable>
        </View>

        {/* HISTÓRICO */}
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-slate-800">
              Histórico de doações
            </Text>

            <Text className="text-sm text-slate-500">
              {doacoesFiltradas.length} registros
            </Text>
          </View>

          {/* LEGENDA */}
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full bg-blue-500" />
              <Text className="text-xs text-slate-600">
                Registro manual
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full bg-emerald-500" />
              <Text className="text-xs text-slate-600">
                Balança IoT
              </Text>
            </View>
          </View>

          {doacoesFiltradas.length === 0 ? (
            <View className="rounded-2xl bg-white p-8">
              <Text className="text-center text-slate-500">
                Nenhuma doação encontrada.
              </Text>
            </View>
          ) : (
            doacoesFiltradas.map((item) => {
              const manual = item.tipo === 'MANUAL';

              return (
                <View
                  key={item.id}
                  className={`rounded-2xl border-l-4 bg-white p-5 shadow-sm ${
                    manual
                      ? 'border-l-blue-500'
                      : 'border-l-emerald-500'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-slate-800">
                      Doação #{item.id}
                    </Text>

                    <View
                      className={`rounded-full px-3 py-1 ${
                        manual ? 'bg-blue-50' : 'bg-emerald-50'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          manual ? 'text-blue-700' : 'text-emerald-700'
                        }`}
                      >
                        {manual ? 'MANUAL' : 'BALANÇA IoT'}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 gap-3">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-500">
                        Data
                      </Text>

                      <Text className="font-semibold text-slate-700">
                        {formatarData(item.data)}
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-500">
                        Quantidade
                      </Text>

                      <Text className="font-semibold text-slate-700">
                        {item.quantidadeKg.toFixed(2).replace('.', ',')} kg
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-500">
                        Unidades estimadas
                      </Text>

                      <Text className="font-semibold text-slate-700">
                        {converterUnidades(item.quantidadeKg).toLocaleString('pt-BR')}
                      </Text>
                    </View>

                    <View className="border-t border-slate-100 pt-3">
                      <Text className="text-sm text-slate-500">
                        Responsável
                      </Text>

                      <Text className="mt-1 font-semibold text-slate-700">
                        {item.responsavel}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 flex-row gap-3">
                    <Pressable
                      onPress={() => editarDoacao(item)}
                      className="flex-1 items-center rounded-xl bg-blue-50 py-3"
                    >
                      <Text className="font-bold text-blue-700">
                        Editar
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => excluirDoacao(item.id)}
                      className="flex-1 items-center rounded-xl bg-red-50 py-3"
                    >
                      <Text className="font-bold text-red-600">
                        Excluir
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </View>
    </ScrollView>
  );
}